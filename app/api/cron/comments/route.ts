// Cron Job — جلب تعليقات Instagram تلقائياً كل 6 ساعات (يتطلب Vercel Pro)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60

const GRAPH_API = 'https://graph.facebook.com/v18.0'

export async function GET(req: NextRequest) {
  // التحقق من Vercel Cron أو CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  if (!cronSecret && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'CRON_SECRET غير مضبوط' }, { status: 401 })
  }

  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!igToken) {
    return NextResponse.json({ success: false, message: 'INSTAGRAM_ACCESS_TOKEN غير مضبوط — تم تخطي جلب التعليقات' })
  }

  try {
    // جلب معلومات الحساب
    const meRes = await fetch(
      `${GRAPH_API}/me?fields=id,username&access_token=${igToken}`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!meRes.ok) {
      return NextResponse.json({ success: false, message: 'رمز Instagram غير صالح' })
    }
    const meData = await meRes.json()
    const igUserId: string = meData.id
    const igUsername: string = meData.username

    if (!igUserId) {
      return NextResponse.json({ success: false, message: 'تعذّر جلب ID المستخدم' })
    }

    // إيجاد الحساب في قاعدة البيانات
    const account = await prisma.account.findFirst({ where: { username: igUsername } })
    if (!account) {
      return NextResponse.json({ success: false, message: `الحساب @${igUsername} غير مسجّل في النظام` })
    }

    // جلب آخر 10 منشورات
    const mediaRes = await fetch(
      `${GRAPH_API}/${igUserId}/media?fields=id,timestamp&limit=10&access_token=${igToken}`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (!mediaRes.ok) {
      return NextResponse.json({ success: false, message: 'تعذّر جلب المنشورات' })
    }
    const mediaItems: Array<{ id: string; timestamp?: string }> =
      (await mediaRes.json()).data || []

    let saved = 0
    for (const media of mediaItems) {
      const commentsRes = await fetch(
        `${GRAPH_API}/${media.id}/comments?fields=id,text,timestamp,username&limit=100&access_token=${igToken}`,
        { signal: AbortSignal.timeout(10000) }
      ).catch(() => null)
      if (!commentsRes?.ok) continue

      const rawComments: Array<{ id: string; text?: string; timestamp?: string }> =
        (await commentsRes.json()).data || []

      for (const c of rawComments) {
        try {
          await prisma.comment.upsert({
            where: { commentId: c.id },
            create: {
              commentId: c.id,
              mediaId: media.id,
              text: c.text || '',
              timestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
              mediaOwner: igUsername,
              accountId: account.id,
            },
            update: { text: c.text || '' },
          })
          saved++
        } catch { /* تجاهل */ }
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم حفظ ${saved} تعليق من ${mediaItems.length} منشور للحساب @${igUsername}`,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في cron التعليقات' }, { status: 500 })
  }
}
