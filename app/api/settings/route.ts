// API إعدادات التطبيق
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({
        data: { webhookEnabled: false, notifyOnFollow: true, notifyOnUnfollow: true, notifyOnNewPost: true, notifyOnNewStory: true, notifyOnBioChange: false, checkIntervalMins: 30 },
      })
    }
    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        telegramBotToken: settings.telegramBotToken ? '****' + settings.telegramBotToken.slice(-6) : null,
        apifyApiToken: settings.apifyApiToken ? '****' + settings.apifyApiToken.slice(-6) : null,
      },
    })
  } catch { return NextResponse.json({ success: false, error: 'خطأ' }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    const body = await req.json()
    const { telegramBotToken, telegramChatId, apifyApiToken, webhookUrl, webhookEnabled, notifyOnFollow, notifyOnUnfollow, notifyOnNewPost, notifyOnNewStory, notifyOnBioChange, checkIntervalMins } = body
    let settings = await prisma.settings.findFirst()
    const updateData: Record<string, unknown> = {}
    if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl
    if (webhookEnabled !== undefined) updateData.webhookEnabled = webhookEnabled
    if (notifyOnFollow !== undefined) updateData.notifyOnFollow = notifyOnFollow
    if (notifyOnUnfollow !== undefined) updateData.notifyOnUnfollow = notifyOnUnfollow
    if (notifyOnNewPost !== undefined) updateData.notifyOnNewPost = notifyOnNewPost
    if (notifyOnNewStory !== undefined) updateData.notifyOnNewStory = notifyOnNewStory
    if (notifyOnBioChange !== undefined) updateData.notifyOnBioChange = notifyOnBioChange
    if (checkIntervalMins !== undefined) updateData.checkIntervalMins = checkIntervalMins
    if (telegramBotToken && !telegramBotToken.startsWith('****')) updateData.telegramBotToken = telegramBotToken
    if (apifyApiToken && !apifyApiToken.startsWith('****')) updateData.apifyApiToken = apifyApiToken
    if (settings) {
      settings = await prisma.settings.update({ where: { id: settings.id }, data: updateData })
    } else {
      settings = await prisma.settings.create({ data: updateData as Parameters<typeof prisma.settings.create>[0]['data'] })
    }
    return NextResponse.json({ success: true, data: settings })
  } catch { return NextResponse.json({ success: false, error: 'خطأ' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    const settings = await prisma.settings.findFirst()
    if (!settings?.telegramBotToken || !settings?.telegramChatId) {
      return NextResponse.json({ success: false, error: 'لم يتم إعداد تيليجرام' }, { status: 400 })
    }
    const sent = await sendTelegramMessage(
      settings.telegramBotToken, settings.telegramChatId,
      `🔔 <b>Alpha Insta Monitor</b>\n\n✅ الاختبار ناجح! النظام يعمل.\n\n📊 ستصلك إشعارات عند:\n📈 زيادة المتابعين\n📉 نقصان المتابعين\n📸 منشور جديد\n🔴 ستوري جديدة`
    )
    if (sent) return NextResponse.json({ success: true, message: 'تم الإرسال 🎉' })
    return NextResponse.json({ success: false, error: 'فشل الإرسال — تحقق من التوكن والـ Chat ID' }, { status: 400 })
  } catch { return NextResponse.json({ success: false, error: 'خطأ' }, { status: 500 }) }
}