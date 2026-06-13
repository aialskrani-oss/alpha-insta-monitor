// Cron Job متطور: فحص التغييرات + المقاييس + FollowerChange
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchInstagramProfile } from '@/lib/instagram'
import {
  notifyBioChange,
  notifyFollowerGain,
  notifyFollowerLoss,
  sendTelegramMessage,
} from '@/lib/telegram'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
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
    if (accounts.length === 0) return NextResponse.json({ message: 'لا توجد حسابات' })

    const hasTelegram = !!(settings?.telegramBotToken && settings?.telegramChatId)
    const summary: Array<Record<string, unknown>> = []

    for (const account of accounts) {
      const entry: Record<string, unknown> = { username: account.username, changes: [] }
      const changes: string[] = []

      try {
        const profile = await fetchInstagramProfile(account.username, apifyToken)
        if (!profile) { entry.error = 'تعذّر الجلب'; summary.push(entry); continue }

        const now = new Date()
        const updateData: Record<string, unknown> = { lastChecked: now, status: 'ACTIVE' }

        // ── متابعون ────────────────────────────────────────────────────────────
        if (profile.followers !== account.followers) {
          const change = profile.followers - account.followers
          await prisma.followerChange.create({
            data: { accountId: account.id, oldCount: account.followers, newCount: profile.followers, change },
          })
          updateData.followers = profile.followers
          updateData.following = profile.following
          updateData.posts = profile.posts

          if (hasTelegram) {
            if (change > 0) {
              await notifyFollowerGain(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.followers, profile.followers, account.avatar)
            } else {
              await notifyFollowerLoss(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.followers, profile.followers)
            }
          }
          changes.push(`متابعون: ${change > 0 ? '+' : ''}${change}`)
        }

        // ── بايو ────────────────────────────────────────────────────────────────
        if (profile.bio !== account.bio) {
          const history = (Array.isArray(account.bioHistory) ? account.bioHistory : [])
          const newHistory = [{ bio: account.bio, changedAt: now.toISOString() }, ...history].slice(0, 10)
          updateData.bio = profile.bio
          updateData.bioHistory = newHistory
          updateData.lastBioChangeAt = now

          await prisma.activity.create({
            data: { type: 'PROFILE_CHANGE', message: `@${account.username} غيّر بايو`, data: { old: account.bio, new: profile.bio }, accountId: account.id },
          })
          if (hasTelegram) await notifyBioChange(settings!.telegramBotToken!, settings!.telegramChatId!, account.username, account.bio ?? null, profile.bio ?? null)
          changes.push('تغيير البايو')
        }

        // ── صورة ────────────────────────────────────────────────────────────────
        if (profile.avatar && profile.avatar !== account.avatar) {
          const history = (Array.isArray(account.ppHistory) ? account.ppHistory : [])
          const newHistory = [{ url: account.avatar, changedAt: now.toISOString() }, ...history].slice(0, 10)
          updateData.avatar = profile.avatar
          updateData.ppHistory = newHistory
          updateData.lastPpChangeAt = now

          await prisma.activity.create({
            data: { type: 'PROFILE_CHANGE', message: `@${account.username} غيّر صورته الشخصية`, accountId: account.id },
          })
          if (hasTelegram) {
            await sendTelegramMessage(settings!.telegramBotToken!, settings!.telegramChatId!,
              `🖼️ <b>صورة جديدة</b>\n\n👤 <a href="https://instagram.com/${account.username}">@${account.username}</a>`)
          }
          changes.push('تغيير الصورة')
        }

        // ── خصوصية ──────────────────────────────────────────────────────────────
        if (profile.isPrivate !== account.isPrivate) {
          updateData.isPrivate = profile.isPrivate
          updateData.lastVisibilityChangeAt = now
          const dir = profile.isPrivate ? 'عام→خاص' : 'خاص→عام'
          await prisma.activity.create({
            data: { type: 'PROFILE_CHANGE', message: `@${account.username} غيّر الخصوصية (${dir})`, accountId: account.id },
          })
          if (hasTelegram) {
            await sendTelegramMessage(settings!.telegramBotToken!, settings!.telegramChatId!,
              `🔒 <b>تغيير الخصوصية</b>\n\n👤 <a href="https://instagram.com/${account.username}">@${account.username}</a>\n${dir}`)
          }
          changes.push(`خصوصية: ${dir}`)
        }

        await prisma.account.update({ where: { id: account.id }, data: updateData })
        entry.changes = changes
        entry.changesCount = changes.length
      } catch (err) {
        entry.error = String(err)
        await prisma.account.update({ where: { id: account.id }, data: { status: 'ERROR' } }).catch(() => {})
      }

      summary.push(entry)
      await new Promise(r => setTimeout(r, 2500))
    }

    return NextResponse.json({
      success: true,
      processed: accounts.length,
      totalChanges: summary.reduce((s, e) => s + ((e.changes as string[])?.length ?? 0), 0),
      summary,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
