// Vercel Cron Job: مراقبة تلقائية مع إشعارات مخصصة لكل حساب
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchInstagramProfile, fetchInstagramPosts, fetchInstagramStories } from '@/lib/instagram'
import { notifyFollowerGain, notifyFollowerLoss, notifyNewPost, notifyNewStory, notifyBioChange } from '@/lib/telegram'

export const maxDuration = 300

// دالة لتحديد ما إذا كان يجب إرسال إشعار لهذا الحساب:
// إعداد الحساب (إذا كان غير null) يتفوق على الإعداد العام
function resolveNotify(accountSetting: boolean | null | undefined, globalSetting: boolean | null | undefined, defaultVal = true): boolean {
  if (accountSetting !== null && accountSetting !== undefined) return accountSetting
  if (globalSetting !== null && globalSetting !== undefined) return globalSetting
  return defaultVal
}

// حساب "آخر ظهور" من البيانات المتاحة
function computeLastActivity(...times: (Date | null | undefined)[]): Date | null {
  const valid = times.filter(Boolean) as Date[]
  if (!valid.length) return null
  return valid.reduce((a, b) => a.getTime() > b.getTime() ? a : b)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const settings = await prisma.settings.findFirst()
    const apifyToken = settings?.apifyApiToken || process.env.APIFY_API_TOKEN || null
    if (!apifyToken) return NextResponse.json({ message: 'Apify API غير مضبوط' })

    const accounts = await prisma.account.findMany({
      where: { isTracked: true, status: 'ACTIVE' },
    })

    if (accounts.length === 0) return NextResponse.json({ message: 'لا توجد حسابات للمراقبة' })

    const hasTelegram = !!(settings?.telegramBotToken && settings?.telegramChatId)
    const results: Array<Record<string, unknown>> = []

    for (const account of accounts) {
      const changes: string[] = []
      const result: Record<string, unknown> = { username: account.username, changes }

      // تحديد إعدادات الإشعارات لهذا الحساب تحديداً
      const notify = {
        follow:    resolveNotify(account.notifyOnFollow,    settings?.notifyOnFollow,    true),
        unfollow:  resolveNotify(account.notifyOnUnfollow,  settings?.notifyOnUnfollow,  true),
        post:      resolveNotify(account.notifyOnNewPost,   settings?.notifyOnNewPost,   true),
        story:     resolveNotify(account.notifyOnNewStory,  settings?.notifyOnNewStory,  true),
        bio:       resolveNotify(account.notifyOnBioChange, settings?.notifyOnBioChange, false),
      }

      try {
        // ─── جلب الملف الشخصي ───────────────────────────────────────
        const profile = await fetchInstagramProfile(account.username, apifyToken)

        if (profile) {
          const now = new Date()
          const updateData: Record<string, unknown> = {
            fullName: profile.fullName,
            avatar: profile.avatar,
            following: profile.following,
            posts: profile.posts,
            lastChecked: now,
            followersAtLastSync: account.followers,
          }

          // ─── تغيير المتابعين ─────────────────────────────────────
          if (profile.followers !== account.followers) {
            const diff = profile.followers - account.followers
            if (diff > 0) {
              if (notify.follow && hasTelegram) {
                await notifyFollowerGain(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.followers, profile.followers, profile.avatar)
              }
              changes.push(`+${diff} متابع`)
            } else {
              if (notify.unfollow && hasTelegram) {
                await notifyFollowerLoss(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.followers, profile.followers)
              }
              changes.push(`${diff} متابع`)
            }
            await prisma.activity.create({ data: {
              type: diff > 0 ? 'FOLLOWER_GAIN' : 'FOLLOWER_LOSS',
              message: diff > 0
                ? `@${account.username} اكتسب +${diff} متابع (الإجمالي: ${profile.followers.toLocaleString('ar')})`
                : `@${account.username} فقد ${Math.abs(diff)} متابع (الإجمالي: ${profile.followers.toLocaleString('ar')})`,
              data: { oldCount: account.followers, newCount: profile.followers, diff },
              accountId: account.id,
            }})
            updateData.followers = profile.followers
          }

          // ─── تغيير السيرة الذاتية ────────────────────────────────
          if (profile.bio !== account.bio) {
            if (notify.bio && hasTelegram) {
              await notifyBioChange(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.bio, profile.bio)
            }
            await prisma.activity.create({ data: {
              type: 'PROFILE_CHANGE',
              message: `@${account.username} غيّر سيرته الذاتية`,
              data: { oldBio: account.bio, newBio: profile.bio },
              accountId: account.id,
            }})
            updateData.bio = profile.bio
            changes.push('تغيير السيرة')
          }

          // تحديث آخر نشاط مرصود
          const lastActivity = computeLastActivity(
            account.lastPostTime ? new Date(account.lastPostTime) : null,
            account.lastStoryTime ? new Date(account.lastStoryTime) : null,
            now
          )
          if (lastActivity) updateData.lastActivityTime = lastActivity

          await prisma.account.update({ where: { id: account.id }, data: updateData })
          await prisma.followerSnapshot.create({
            data: { followers: profile.followers, following: profile.following, posts: profile.posts, accountId: account.id },
          })

          result.followers = profile.followers
          result.notifySettings = notify
        }

        // ─── منشورات جديدة ──────────────────────────────────────────
        if (notify.post) {
          const posts = await fetchInstagramPosts(account.username, apifyToken, 3)
          for (const post of posts) {
            if (!post.id) continue
            const postDate = new Date(post.timestamp)
            const lastKnown = account.lastPostTime ? new Date(account.lastPostTime) : null
            if (post.id !== account.lastPostId && (!lastKnown || postDate > lastKnown)) {
              if (hasTelegram) await notifyNewPost(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, post)
              await prisma.activity.create({ data: {
                type: 'NEW_POST',
                message: `@${account.username} نشر ${post.isVideo ? 'فيديو' : 'منشور'} جديد`,
                data: { url: post.url, imageUrl: post.imageUrl, likes: post.likes, isVideo: post.isVideo },
                accountId: account.id,
              }})
              // تحديث آخر نشاط
              await prisma.account.update({ where: { id: account.id }, data: {
                lastPostId: post.id,
                lastPostTime: postDate,
                lastActivityTime: postDate,
              }})
              changes.push('منشور جديد')
              break
            }
          }
        }

        // ─── ستوريز جديدة ──────────────────────────────────────────
        if (notify.story) {
          const stories = await fetchInstagramStories(account.username, apifyToken)
          for (const story of stories) {
            if (!story.id) continue
            const storyDate = new Date(story.timestamp)
            const lastKnown = account.lastStoryTime ? new Date(account.lastStoryTime) : null
            if (story.id !== account.lastStoryId && (!lastKnown || storyDate > lastKnown)) {
              if (hasTelegram) await notifyNewStory(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, story)
              await prisma.activity.create({ data: {
                type: 'NEW_STORY',
                message: `@${account.username} نشر ستوري جديدة`,
                data: { imageUrl: story.imageUrl, videoUrl: story.videoUrl, timestamp: story.timestamp },
                accountId: account.id,
              }})
              // الستوري = دليل قوي على أن الشخص كان على الإنستقرام مؤخراً
              await prisma.account.update({ where: { id: account.id }, data: {
                lastStoryId: story.id,
                lastStoryTime: storyDate,
                lastActivityTime: storyDate,
              }})
              changes.push('ستوري جديدة')
              break
            }
          }
        }

      } catch (err) {
        result.error = String(err)
        await prisma.account.update({ where: { id: account.id }, data: { status: 'ERROR', lastChecked: new Date() } })
      }

      results.push(result)
      await new Promise(r => setTimeout(r, 2000))
    }

    return NextResponse.json({ success: true, processed: accounts.length, results })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
