// API مزامنة يدوية لحساب واحد - مع تحديث آخر نشاط وإشعارات
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchInstagramProfile } from '@/lib/instagram'
import { notifyFollowerGain, notifyFollowerLoss, notifyBioChange } from '@/lib/telegram'

function resolveNotify(accountSetting: boolean | null | undefined, globalSetting: boolean | null | undefined, defaultVal = true): boolean {
  if (accountSetting !== null && accountSetting !== undefined) return accountSetting
  if (globalSetting !== null && globalSetting !== undefined) return globalSetting
  return defaultVal
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const account = await prisma.account.findFirst({ where: { id: params.id, userId: session.user.id } })
    if (!account) return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })

    const settings = await prisma.settings.findFirst()
    const apifyToken = settings?.apifyApiToken || process.env.APIFY_API_TOKEN || null
    if (!apifyToken) {
      return NextResponse.json({ success: false, error: 'يجب إضافة Apify API Token في الإعدادات أولاً', needsSetup: true })
    }

    const fresh = await fetchInstagramProfile(account.username, apifyToken)
    if (!fresh) {
      await prisma.account.update({ where: { id: params.id }, data: { lastChecked: new Date() } })
      return NextResponse.json({ success: false, error: 'تعذّر الاتصال بـ Instagram' })
    }

    const now = new Date()
    const updateData: Record<string, unknown> = {
      fullName: fresh.fullName || account.fullName,
      avatar: fresh.avatar ?? account.avatar,
      bio: fresh.bio ?? account.bio,
      followers: fresh.followers,
      following: fresh.following,
      posts: fresh.posts,
      lastChecked: now,
      lastActivityTime: now,
    }

    const hasTelegram = !!(settings?.telegramBotToken && settings?.telegramChatId)
    const changes: string[] = []

    // إشعار تغيير المتابعين
    const followerDiff = fresh.followers - account.followers
    if (followerDiff !== 0) {
      const notify = resolveNotify(
        followerDiff > 0 ? account.notifyOnFollow : account.notifyOnUnfollow,
        followerDiff > 0 ? settings?.notifyOnFollow : settings?.notifyOnUnfollow,
        true
      )
      if (notify && hasTelegram) {
        if (followerDiff > 0)
          await notifyFollowerGain(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.followers, fresh.followers, fresh.avatar)
        else
          await notifyFollowerLoss(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.followers, fresh.followers)
      }
      await prisma.activity.create({
        data: {
          type: followerDiff > 0 ? 'FOLLOWER_GAIN' : 'FOLLOWER_LOSS',
          message: followerDiff > 0
            ? `@${account.username} اكتسب +${followerDiff} متابع (الإجمالي: ${fresh.followers.toLocaleString('ar')})`
            : `@${account.username} فقد ${Math.abs(followerDiff)} متابع (الإجمالي: ${fresh.followers.toLocaleString('ar')})`,
          data: { oldCount: account.followers, newCount: fresh.followers, diff: followerDiff },
          accountId: params.id,
        },
      })
      changes.push(followerDiff > 0 ? `+${followerDiff} متابع` : `${followerDiff} متابع`)
    }

    // إشعار تغيير السيرة
    if (fresh.bio !== account.bio) {
      const notify = resolveNotify(account.notifyOnBioChange, settings?.notifyOnBioChange, false)
      if (notify && hasTelegram) {
        await notifyBioChange(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.bio, fresh.bio)
      }
      await prisma.activity.create({
        data: {
          type: 'PROFILE_CHANGE',
          message: `@${account.username} غيّر سيرته الذاتية`,
          data: { oldBio: account.bio, newBio: fresh.bio },
          accountId: params.id,
        },
      })
      changes.push('تغيير السيرة')
    }

    const updated = await prisma.account.update({ where: { id: params.id }, data: updateData })

    await prisma.followerSnapshot.create({
      data: { followers: fresh.followers, following: fresh.following, posts: fresh.posts, accountId: params.id },
    })

    const msg = changes.length > 0
      ? `✅ ${changes.join(' · ')}`
      : `✅ ${fresh.followers.toLocaleString('ar')} متابع — لا تغييرات`

    return NextResponse.json({ success: true, data: updated, message: msg, changes })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ أثناء المزامنة' }, { status: 500 })
  }
}
