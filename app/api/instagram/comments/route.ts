// API جلب وعرض تعليقات Instagram عبر Instagram Graph API
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const GRAPH_API = 'https://graph.facebook.com/v18.0'

// GET /api/instagram/comments?accountId=&limit=50
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const accountId = req.nextUrl.searchParams.get('accountId')
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 200)

    const comments = await prisma.comment.findMany({
      where: accountId ? { accountId } : undefined,
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        account: { select: { username: true, avatar: true } },
      },
    })

    return NextResponse.json({ success: true, data: comments, count: comments.length })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في جلب التعليقات' }, { status: 500 })
  }
}

// POST /api/instagram/comments — يجلب من Instagram Graph API ويحفظ
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const igToken = process.env.INSTAGRAM_ACCESS_TOKEN
    if (!igToken) {
      return NextResponse.json(
        { success: false, error: 'INSTAGRAM_ACCESS_TOKEN غير مضبوط في متغيرات البيئة' },
        { status: 503 }
      )
    }

    // جلب معلومات الحساب المصادق عليه من Instagram
    const meRes = await fetch(
      `${GRAPH_API}/me?fields=id,username&access_token=${igToken}`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!meRes.ok) {
      const err = await meRes.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: err?.error?.message || 'رمز Instagram غير صالح أو منتهي الصلاحية' },
        { status: 400 }
      )
    }
    const meData = await meRes.json()
    const igUserId: string = meData.id
    const igUsername: string = meData.username

    if (!igUserId || !igUsername) {
      return NextResponse.json(
        { success: false, error: 'تعذّر جلب معلومات المستخدم من Instagram Graph API' },
        { status: 400 }
      )
    }

    // إيجاد الحساب المطابق في قاعدة البيانات
    const account = await prisma.account.findFirst({
      where: { username: igUsername, userId: session.user.id },
    })
    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: `الحساب @${igUsername} غير موجود في الحسابات المراقبة. أضفه أولاً من صفحة الحسابات.`,
        },
        { status: 404 }
      )
    }

    // جلب آخر 20 منشور للحساب
    const mediaRes = await fetch(
      `${GRAPH_API}/${igUserId}/media?fields=id,caption,media_type,timestamp&limit=20&access_token=${igToken}`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (!mediaRes.ok) {
      return NextResponse.json(
        { success: false, error: 'تعذّر جلب منشورات Instagram' },
        { status: 400 }
      )
    }
    const mediaData = await mediaRes.json()
    const mediaItems: Array<{ id: string; caption?: string; media_type?: string; timestamp?: string }> =
      mediaData.data || []

    let totalFetched = 0
    let totalSaved = 0

    // جلب التعليقات لكل منشور
    for (const media of mediaItems) {
      const commentsRes = await fetch(
        `${GRAPH_API}/${media.id}/comments?fields=id,text,timestamp,username&limit=100&access_token=${igToken}`,
        { signal: AbortSignal.timeout(10000) }
      ).catch(() => null)
      if (!commentsRes || !commentsRes.ok) continue

      const commentsData = await commentsRes.json()
      const rawComments: Array<{ id: string; text?: string; timestamp?: string; username?: string }> =
        commentsData.data || []
      totalFetched += rawComments.length

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
          totalSaved++
        } catch {
          // تجاهل التكرار
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        account: igUsername,
        postsChecked: mediaItems.length,
        commentsFetched: totalFetched,
        commentsSaved: totalSaved,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في الاتصال بـ Instagram Graph API' },
      { status: 500 }
    )
  }
}
