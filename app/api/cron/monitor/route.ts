// Vercel Cron Job — مراقبة شاملة: ستوريات + منشورات + متابعين + خصوصية
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchInstagramProfile, fetchInstagramPosts, fetchInstagramStories } from '@/lib/instagram'
import {
  notifyFollowerGain, notifyFollowerLoss,
  notifyNewPost, notifyNewStory, notifyBioChange,
  sendTelegramMessage,
} from '@/lib/telegram'

export const maxDuration = 300

function resolveNotify(
  accountSetting: boolean | null | undefined,
  globalSetting: boolean | null | undefined,
  defaultVal = true
): boolean {
  if (accountSetting !== null && accountSetting !== undefined) return accountSetting
  if (globalSetting !== null && globalSetting !== undefined) return globalSetting
  return defaultVal
}

export async function GET(req: NextRequest) {
  // التحقق من مصدر الطلب: Vercel Cron أو external cron service
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Vercel Cron يرسل Authorization: Bearer {CRON_SECRET} تلقائياً
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  // إذا لم يكن CRON_SECRET مضبوطاً نسمح بالوصول (development فقط)
  if (!cronSecret && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'CRON_SECRET غير مضبوط' }, { status: 401 })
  }

  try {
    const settings = await prisma.settings.findFirst()
    const apifyToken = settings?.apifyApiToken || process.env.APIFY_API_TOKEN || null
    if (!apifyToken) return NextResponse.json({ message: 'Apify API غير مضبوط' })

    const accounts = await prisma.account.findMany({
      where: { isTracked: true, status: { in: ['ACTIVE', 'ERROR'] } },
    })

    if (accounts.length === 0) return NextResponse.json({ message: 'لا توجد حسابات للمراقبة' })

    const hasTelegram = !!(settings?.telegramBotToken && settings?.telegramChatId)
    const results: Array<Record<string, unknown>> = []

    for (const account of accounts) {
      const changes: string[] = []
      const result: Record<string, unknown> = { username: account.username, changes }

      const notify = {
        follow:   resolveNotify(account.notifyOnFollow,    settings?.notifyOnFollow,    true),
        unfollow: resolveNotify(account.notifyOnUnfollow,  settings?.notifyOnUnfollow,  true),
        post:     resolveNotify(account.notifyOnNewPost,   settings?.notifyOnNewPost,   true),
        story:    resolveNotify(account.notifyOnNewStory,  settings?.notifyOnNewStory,  true),
        bio:      resolveNotify(account.notifyOnBioChange, settings?.notifyOnBioChange, false),
        private:  resolveNotify(undefined, (settings as { notifyOnPrivate?: boolean })?.notifyOnPrivate ?? true, true),
      }

      try {
        const now = new Date()

        // ─── 1. جلب الملف الشخصي ─────────────────────────────────────────
        const profile = await fetchInstagramProfile(account.username, apifyToken)

        if (profile) {
          const updateData: Record<string, unknown> = {
            fullName: profile.fullName,
            avatar: profile.avatar,
            following: profile.following,
            posts: profile.posts,
            isVerified: profile.isVerified,
            lastChecked: now,
            status: 'ACTIVE',
          }

          // ─── تغيير المتابعين ──────────────────────────────────────────────
          if (profile.followers !== account.followers) {
            const diff = profile.followers - account.followers
            if (diff > 0 && notify.follow && hasTelegram) {
              await notifyFollowerGain(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.followers, profile.followers, profile.avatar)
            } else if (diff < 0 && notify.unfollow && hasTelegram) {
              await notifyFollowerLoss(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.followers, profile.followers)
            }
            await prisma.activity.create({
              data: {
                type: diff > 0 ? 'FOLLOWER_GAIN' : 'FOLLOWER_LOSS',
                message: diff > 0
                  ? `@${account.username} اكتسب +${diff} متابع (الإجمالي: ${profile.followers.toLocaleString('ar')})`
                  : `@${account.username} فقد ${Math.abs(diff)} متابع (الإجمالي: ${profile.followers.toLocaleString('ar')})`,
                data: { oldCount: account.followers, newCount: profile.followers, diff },
                accountId: account.id,
              },
            })
            updateData.followers = profile.followers
            updateData.followersAtLastSync = account.followers
            changes.push(diff > 0 ? `+${diff} متابع` : `${diff} متابع`)
          }

          // ─── تغيير الخصوصية (خاص ↔ عام) ─────────────────────────────────
          if (profile.isPrivate !== account.isPrivate) {
            const wentPublic = !profile.isPrivate && account.isPrivate
            const wentPrivate = profile.isPrivate && !account.isPrivate
            if (hasTelegram && notify.private) {
              const msg = wentPublic
                ? `🔓 <b>تحوّل الحساب إلى عام!</b>\n\n👤 <a href="https://instagram.com/${account.username}">@${account.username}</a>\n✅ يمكن الآن رؤية منشوراته وستورياته`
                : `🔒 <b>تحوّل الحساب إلى خاص</b>\n\n👤 <a href="https://instagram.com/${account.username}">@${account.username}</a>\n⚠️ لن تظهر منشوراته وستورياته`
              await sendTelegramMessage(settings!.telegramBotToken!, settings!.telegramChatId!, msg)
            }
            await prisma.activity.create({
              data: {
                type: 'PROFILE_CHANGE',
                message: wentPublic
                  ? `@${account.username} حوّل حسابه من خاص إلى عام 🔓`
                  : `@${account.username} حوّل حسابه من عام إلى خاص 🔒`,
                data: { wasPrivate: account.isPrivate, isNowPrivate: profile.isPrivate },
                accountId: account.id,
              },
            })
            updateData.isPrivate = profile.isPrivate
            changes.push(wentPublic ? 'أصبح عاماً' : 'أصبح خاصاً')
          }

          // ─── تغيير السيرة الذاتية ─────────────────────────────────────────
          if (profile.bio !== account.bio) {
            if (notify.bio && hasTelegram) {
              await notifyBioChange(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.bio, profile.bio)
            }
            await prisma.activity.create({
              data: {
                type: 'PROFILE_CHANGE',
                message: `@${account.username} غيّر سيرته الذاتية`,
                data: { oldBio: account.bio, newBio: profile.bio },
                accountId: account.id,
              },
            })
            updateData.bio = profile.bio
            changes.push('تغيير السيرة')
          }

          updateData.lastActivityTime = now
          await prisma.account.update({ where: { id: account.id }, data: updateData })
          await prisma.followerSnapshot.create({
            data: {
              followers: profile.followers,
              following: profile.following,
              posts: profile.posts,
              accountId: account.id,
            },
          })
          result.followers = profile.followers
        }

        // ─── 2. فحص الستوريات (إذا الحساب عام) ─────────────────────────────
        if (!account.isPrivate) {
          const stories = await fetchInstagramStories(account.username, apifyToken)

          if (stories.length > 0) {
            const latestStory = stories.reduce((a, b) =>
              new Date(a.timestamp) > new Date(b.timestamp) ? a : b
            )
            const latestTime = new Date(latestStory.timestamp)
            await prisma.account.update({
              where: { id: account.id },
              data: { lastStoryTime: latestTime, lastActivityTime: latestTime },
            })
          }

          if (notify.story) {
            const knownStories = await prisma.story.findMany({
              where: { accountId: account.id, deletedAt: null },
              select: { id: true },
            })
            const knownIds = knownStories.map(s => s.id)
            const fetchedIds = new Set(stories.map(s => s.id).filter(Boolean))

            for (const story of stories) {
              if (!story.id || knownIds.includes(story.id)) continue
              const storyDate = new Date(story.timestamp)
              const expiresAt = new Date(storyDate.getTime() + 24 * 3600 * 1000)

              if (hasTelegram) await notifyNewStory(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, story)

              await prisma.story.upsert({
                where: { id: story.id },
                create: {
                  id: story.id,
                  imageUrl: story.imageUrl,
                  videoUrl: story.videoUrl,
                  expiresAt,
                  notified: true,
                  accountId: account.id,
                },
                update: { notified: true },
              })

              await prisma.activity.create({
                data: {
                  type: 'NEW_STORY',
                  message: `@${account.username} نشر ستوري جديدة`,
                  data: { imageUrl: story.imageUrl, videoUrl: story.videoUrl, timestamp: story.timestamp },
                  accountId: account.id,
                },
              })

              await prisma.account.update({
                where: { id: account.id },
                data: {
                  lastStoryId: story.id,
                  lastStoryTime: storyDate,
                  lastActivityTime: storyDate,
                },
              })

              changes.push('ستوري جديدة')
            }

            for (const knownId of knownIds) {
              if (!fetchedIds.has(knownId)) {
                await prisma.story.update({ where: { id: knownId }, data: { deletedAt: new Date() } })
                if (hasTelegram) {
                  await sendTelegramMessage(
                    settings!.telegramBotToken!, settings!.telegramChatId!,
                    `🗑️ <b>ستوري محذوفة</b>\n\n👤 <a href="https://instagram.com/${account.username}">@${account.username}</a>\nتم حذف ستوري قبل انتهاء 24 ساعة`
                  )
                }
                changes.push('ستوري محذوفة')
              }
            }
          }
        }

        // ─── 3. فحص المنشورات ────────────────────────────────────────────────
        if (!account.isPrivate && notify.post) {
          const posts = await fetchInstagramPosts(account.username, apifyToken, 3)
          for (const post of posts) {
            if (!post.id) continue
            const postDate = new Date(post.timestamp)
            const lastKnown = account.lastPostTime ? new Date(account.lastPostTime) : null
            if (post.id !== account.lastPostId && (!lastKnown || postDate > lastKnown)) {
              if (hasTelegram) await notifyNewPost(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, post)
              await prisma.activity.create({
                data: {
                  type: 'NEW_POST',
                  message: `@${account.username} نشر ${post.isVideo ? 'فيديو' : 'منشور'} جديد`,
                  data: { url: post.url, imageUrl: post.imageUrl, likes: post.likes, isVideo: post.isVideo },
                  accountId: account.id,
                },
              })
              await prisma.account.update({
                where: { id: account.id },
                data: { lastPostId: post.id, lastPostTime: postDate, lastActivityTime: postDate },
              })
              changes.push('منشور جديد')
              break
            }
          }
        }

      } catch (err) {
        result.error = String(err)
        await prisma.account.update({
          where: { id: account.id },
          data: { status: 'ERROR', lastChecked: new Date() },
        })
      }

      results.push(result)
      // تأخير بين الحسابات لتجنب Rate Limiting
      await new Promise(r => setTimeout(r, 2500))
    }

    return NextResponse.json({ success: true, processed: accounts.length, results })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
