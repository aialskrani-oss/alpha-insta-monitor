// Vercel Cron Job: مراقبة تلقائية
  import { NextRequest, NextResponse } from 'next/server'
  import { prisma } from '@/lib/prisma'
  import { fetchInstagramProfile, fetchInstagramPosts, fetchInstagramStories } from '@/lib/instagram'
  import { notifyFollowerGain, notifyFollowerLoss, notifyNewPost, notifyNewStory, notifyBioChange } from '@/lib/telegram'

  export const maxDuration = 300

  export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    try {
      const settings = await prisma.settings.findFirst()
      if (!settings?.apifyApiToken) {
        return NextResponse.json({ message: 'Apify API غير مضبوط' })
      }

      const accounts = await prisma.account.findMany({
        where: { isTracked: true, status: 'ACTIVE' },
      })

      if (accounts.length === 0) return NextResponse.json({ message: 'لا توجد حسابات' })

      const hasTelegram = !!(settings.telegramBotToken && settings.telegramChatId)
      const results: Array<Record<string, unknown>> = []

      for (const account of accounts) {
        const changes: string[] = []
        const result: Record<string, unknown> = { username: account.username, changes }

        try {
          const profile = await fetchInstagramProfile(account.username, settings.apifyApiToken)

          if (profile) {
            const updateData: Record<string, unknown> = {
              fullName: profile.fullName,
              avatar: profile.avatar,
              following: profile.following,
              lastChecked: new Date(),
              followersAtLastSync: account.followers,
            }

            if (profile.followers !== account.followers) {
              const diff = profile.followers - account.followers
              if (diff > 0 && settings.notifyOnFollow && hasTelegram) {
                await notifyFollowerGain(settings.telegramBotToken!, settings.telegramChatId!, account.username, account.followers, profile.followers, profile.avatar)
                changes.push(`+${diff} followers`)
              } else if (diff < 0 && settings.notifyOnUnfollow && hasTelegram) {
                await notifyFollowerLoss(settings.telegramBotToken!, settings.telegramChatId!, account.username, account.followers, profile.followers)
                changes.push(`${diff} followers`)
              }
              await prisma.activity.create({ data: {
                type: diff > 0 ? 'FOLLOWER_GAIN' : 'FOLLOWER_LOSS',
                message: diff > 0 ? `@${account.username} اكتسب +${diff} متابع` : `@${account.username} فقد ${Math.abs(diff)} متابع`,
                accountId: account.id,
              }})
              updateData.followers = profile.followers
            }

            if (profile.bio !== account.bio && settings.notifyOnBioChange && hasTelegram) {
              await notifyBioChange(settings.telegramBotToken!, settings.telegramChatId!, account.username, account.bio, profile.bio)
              await prisma.activity.create({ data: { type: 'PROFILE_CHANGE', message: `@${account.username} غيّر سيرته`, accountId: account.id }})
              updateData.bio = profile.bio
              changes.push('bio changed')
            }

            await prisma.account.update({ where: { id: account.id }, data: updateData })
            await prisma.followerSnapshot.create({
              data: { followers: profile.followers, following: profile.following, posts: profile.posts, accountId: account.id },
            })
          }

          if (settings.notifyOnNewPost) {
            const posts = await fetchInstagramPosts(account.username, settings.apifyApiToken, 3)
            for (const post of posts) {
              if (!post.id) continue
              const postDate = new Date(post.timestamp)
              const lastKnown = account.lastPostTime ? new Date(account.lastPostTime) : null
              if (post.id !== account.lastPostId && (!lastKnown || postDate > lastKnown)) {
                if (hasTelegram) await notifyNewPost(settings.telegramBotToken!, settings.telegramChatId!, account.username, post)
                await prisma.activity.create({ data: { type: 'NEW_POST', message: `@${account.username} نشر منشوراً جديداً`, data: { url: post.url, imageUrl: post.imageUrl }, accountId: account.id }})
                await prisma.account.update({ where: { id: account.id }, data: { lastPostId: post.id, lastPostTime: postDate }})
                changes.push('new post')
                break
              }
            }
          }

          if (settings.notifyOnNewStory) {
            const stories = await fetchInstagramStories(account.username, settings.apifyApiToken)
            for (const story of stories) {
              if (!story.id) continue
              const storyDate = new Date(story.timestamp)
              const lastKnown = account.lastStoryTime ? new Date(account.lastStoryTime) : null
              if (story.id !== account.lastStoryId && (!lastKnown || storyDate > lastKnown)) {
                if (hasTelegram) await notifyNewStory(settings.telegramBotToken!, settings.telegramChatId!, account.username, story)
                await prisma.activity.create({ data: { type: 'NEW_STORY', message: `@${account.username} نشر ستوري جديدة`, accountId: account.id }})
                await prisma.account.update({ where: { id: account.id }, data: { lastStoryId: story.id, lastStoryTime: storyDate }})
                changes.push('new story')
                break
              }
            }
          }

        } catch (err) {
          result.error = String(err)
          await prisma.account.update({ where: { id: account.id }, data: { status: 'ERROR', lastChecked: new Date() }})
        }
        results.push(result)
        await new Promise(r => setTimeout(r, 2000))
      }

      return NextResponse.json({ success: true, processed: accounts.length, results })
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }
  }