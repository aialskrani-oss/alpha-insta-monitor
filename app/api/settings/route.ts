// API إعدادات التطبيق
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/utils'

// جلب الإعدادات
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    let settings = await prisma.settings.findFirst()

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          webhookEnabled: false,
          notifyOnFollow: true,
          notifyOnUnfollow: true,
          notifyOnNewPost: true,
          checkIntervalMins: 60,
        },
      })
    }

    // إخفاء التوكن جزئياً في الاستجابة
    const safeSettings = {
      ...settings,
      telegramBotToken: settings.telegramBotToken
        ? '****' + settings.telegramBotToken.slice(-6)
        : null,
    }

    return NextResponse.json({ success: true, data: safeSettings })
  } catch (error) {
    console.error('GET /api/settings:', error)
    return NextResponse.json({ success: false, error: 'خطأ في جلب الإعدادات' }, { status: 500 })
  }
}

// تحديث الإعدادات
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json()
    const {
      telegramBotToken,
      telegramChatId,
      webhookUrl,
      webhookEnabled,
      notifyOnFollow,
      notifyOnUnfollow,
      notifyOnNewPost,
      checkIntervalMins,
    } = body

    let settings = await prisma.settings.findFirst()

    const updateData: Record<string, unknown> = {
      ...(telegramChatId !== undefined && { telegramChatId }),
      ...(webhookUrl !== undefined && { webhookUrl }),
      ...(webhookEnabled !== undefined && { webhookEnabled }),
      ...(notifyOnFollow !== undefined && { notifyOnFollow }),
      ...(notifyOnUnfollow !== undefined && { notifyOnUnfollow }),
      ...(notifyOnNewPost !== undefined && { notifyOnNewPost }),
      ...(checkIntervalMins !== undefined && { checkIntervalMins }),
    }

    // تحديث التوكن فقط إذا تم إرساله كاملاً (ليس مُقنَّعاً)
    if (telegramBotToken && !telegramBotToken.startsWith('****')) {
      updateData.telegramBotToken = telegramBotToken
    }

    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
      })
    } else {
      settings = await prisma.settings.create({ data: updateData })
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('PUT /api/settings:', error)
    return NextResponse.json({ success: false, error: 'خطأ في حفظ الإعدادات' }, { status: 500 })
  }
}

// اختبار إشعار تيليجرام
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const settings = await prisma.settings.findFirst()

    if (!settings?.telegramBotToken || !settings?.telegramChatId) {
      return NextResponse.json({ success: false, error: 'لم يتم إعداد بوت تيليجرام بعد' }, { status: 400 })
    }

    const message = `🔔 <b>Alpha Insta Monitor</b>\n\nاختبار الإشعارات ناجح! ✅\nأهلاً بك في نظام المراقبة.`
    const sent = await sendTelegramNotification(
      settings.telegramBotToken,
      settings.telegramChatId,
      message
    )

    if (sent) {
      return NextResponse.json({ success: true, message: 'تم إرسال الاختبار بنجاح' })
    } else {
      return NextResponse.json({ success: false, error: 'فشل إرسال الاختبار - تحقق من التوكن' }, { status: 400 })
    }
  } catch (error) {
    console.error('POST /api/settings:', error)
    return NextResponse.json({ success: false, error: 'خطأ في اختبار الإشعار' }, { status: 500 })
  }
}
