// API كشف وتسجيل تغييرات الحسابات (بايو، صورة، خصوصية)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchInstagramProfile } from '@/lib/instagram'
import {
  notifyBioChange,
  sendTelegramMessage,
} from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { accountId } = body as { accountId?: string }

    const where = accountId
      ? { id: accountId, userId: session.user.id }
      : { userId: session.user.id, isTracked: true }

    const accounts = await prisma.account.findMany({ where })
    if (accounts.length === 0) {
      return NextResponse.json({ success: false, error: 'لا توجد حسابات' }, { status: 404 })
    }

    const settings = await prisma.settings.findFirst()
    const apifyToken = settings?.apifyApiToken || process.env.APIFY_API_TOKEN || null
    const hasTelegram = !!(settings?.telegramBotToken && settings?.telegramChatId)

    const results: Array<Record<string, unknown>> = []

    for (const account of accounts) {
      const result: Record<string, unknown> = { accountId: account.id, username: account.username, changes: [] }
      const changes: string[] = []

      if (!apifyToken) {
        result.error = 'Apify token غير متاح'
        results.push(result)
        continue
      }

      try {
        const profile = await fetchInstagramProfile(account.username, apifyToken)
        if (!profile) {
          result.error = 'تعذّر جلب الملف الشخصي'
          results.push(result)
          continue
        }

        const now = new Date()
        const updateData: Record<string, unknown> = {}

        // ── كشف تغيير البايو ──────────────────────────────────────────────────
        if (profile.bio !== account.bio) {
          const oldBioHistory = Array.isArray(account.bioHistory) ? account.bioHistory : []
          const newHistory = [
            { bio: account.bio, changedAt: now.toISOString() },
            ...oldBioHistory,
          ].slice(0, 10)

          updateData.bio = profile.bio
          updateData.bioHistory = newHistory
          updateData.lastBioChangeAt = now
          changes.push('تغيير البايو')

          await prisma.activity.create({
            data: {
              type: 'PROFILE_CHANGE',
              message: `@${account.username} غيّر سيرته الذاتية`,
              data: { oldBio: account.bio, newBio: profile.bio },
              accountId: account.id,
            },
          })

          if (hasTelegram) {
            await notifyBioChange(
              settings!.telegramBotToken!,
              settings!.telegramChatId!,
              account.username,
              account.bio ?? null,
              profile.bio ?? null
            )
          }
        }

        // ── كشف تغيير الصورة الشخصية ─────────────────────────────────────────
        if (profile.avatar && profile.avatar !== account.avatar) {
          const oldPpHistory = Array.isArray(account.ppHistory) ? account.ppHistory : []
          const newHistory = [
            { url: account.avatar, changedAt: now.toISOString() },
            ...oldPpHistory,
          ].slice(0, 10)

          updateData.avatar = profile.avatar
          updateData.ppHistory = newHistory
          updateData.lastPpChangeAt = now
          changes.push('تغيير الصورة الشخصية')

          await prisma.activity.create({
            data: {
              type: 'PROFILE_CHANGE',
              message: `@${account.username} غيّر صورته الشخصية`,
              data: { oldAvatar: account.avatar, newAvatar: profile.avatar },
              accountId: account.id,
            },
          })

          if (hasTelegram) {
            await sendTelegramMessage(
              settings!.telegramBotToken!,
              settings!.telegramChatId!,
              `🖼️ <b>تغيير الصورة الشخصية</b>\n\n👤 <a href="https://instagram.com/${account.username}">@${account.username}</a>\nتم تغيير الصورة الشخصية`
            )
          }
        }

        // ── كشف تغيير الخصوصية ───────────────────────────────────────────────
        if (profile.isPrivate !== account.isPrivate) {
          updateData.isPrivate = profile.isPrivate
          updateData.lastVisibilityChangeAt = now
          const direction = profile.isPrivate ? 'عام → خاص 🔒' : 'خاص → عام 🌐'
          changes.push(`تغيير الخصوصية: ${direction}`)

          await prisma.activity.create({
            data: {
              type: 'PROFILE_CHANGE',
              message: `@${account.username} غيّر خصوصية الحساب (${direction})`,
              data: { wasPrivate: account.isPrivate, isPrivate: profile.isPrivate },
              accountId: account.id,
            },
          })

          if (hasTelegram) {
            await sendTelegramMessage(
              settings!.telegramBotToken!,
              settings!.telegramChatId!,
              `🔒 <b>تغيير خصوصية الحساب</b>\n\n👤 <a href="https://instagram.com/${account.username}">@${account.username}</a>\n${direction}`
            )
          }
        }

        // ── تغيير المتابعين (تسجيل FollowerChange) ───────────────────────────
        if (profile.followers !== account.followers) {
          const change = profile.followers - account.followers
          await prisma.followerChange.create({
            data: {
              accountId: account.id,
              oldCount: account.followers,
              newCount: profile.followers,
              change,
            },
          })
          updateData.followers = profile.followers
          updateData.following = profile.following
          updateData.posts = profile.posts
          changes.push(`تغيير المتابعين: ${change > 0 ? '+' : ''}${change}`)
        }

        if (Object.keys(updateData).length > 0) {
          updateData.lastChecked = now
          await prisma.account.update({ where: { id: account.id }, data: updateData })
        }

        result.changes = changes
        result.changesCount = changes.length
      } catch (err) {
        result.error = String(err)
      }

      results.push(result)
      await new Promise(r => setTimeout(r, 2000))
    }

    const totalChanges = results.reduce((s, r) => s + ((r.changes as string[])?.length ?? 0), 0)
    return NextResponse.json({ success: true, data: { processed: results.length, totalChanges, results } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في كشف التغييرات' }, { status: 500 })
  }
}

// GET: جلب آخر التغييرات المسجّلة
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 100)
    const accountId = req.nextUrl.searchParams.get('accountId')

    const changes = await prisma.followerChange.findMany({
      where: {
        account: { userId: session.user.id },
        ...(accountId ? { accountId } : {}),
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      include: { account: { select: { username: true, avatar: true } } },
    })

    return NextResponse.json({ success: true, data: changes })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في جلب التغييرات' }, { status: 500 })
  }
}
