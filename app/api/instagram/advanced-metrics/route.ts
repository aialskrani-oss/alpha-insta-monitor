// API جلب المقاييس المتقدمة من Instagram Graph API
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const GRAPH = 'https://graph.facebook.com/v18.0'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const igToken = process.env.INSTAGRAM_ACCESS_TOKEN
    if (!igToken) return NextResponse.json({ success: false, error: 'INSTAGRAM_ACCESS_TOKEN غير مضبوط' }, { status: 503 })

    const mediaId = req.nextUrl.searchParams.get('mediaId')

    if (mediaId) {
      const fields = 'id,like_count,comments_count,media_type,timestamp,caption'
      const res = await fetch(`${GRAPH}/${mediaId}?fields=${fields}&access_token=${igToken}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return NextResponse.json({ success: false, error: (err as Record<string,Record<string,string>>)?.error?.message || 'تعذّر جلب المقاييس' }, { status: 400 })
      }
      const data = await res.json() as Record<string, unknown>

      let insights: Record<string, number> = {}
      const insRes = await fetch(
        `${GRAPH}/${mediaId}/insights?metric=reach,saved,video_views&access_token=${igToken}`,
        { signal: AbortSignal.timeout(8000) }
      ).catch(() => null)
      if (insRes?.ok) {
        const insData = await insRes.json() as { data?: Array<{name: string; values?: Array<{value: number}>}> }
        for (const item of insData?.data || []) {
          insights[item.name] = item.values?.[0]?.value ?? 0
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          mediaId: data.id,
          likeCount: data.like_count ?? 0,
          commentsCount: data.comments_count ?? 0,
          mediaType: data.media_type,
          timestamp: data.timestamp,
          caption: data.caption,
          reach: insights.reach ?? null,
          saved: insights.saved ?? null,
          videoViews: insights.video_views ?? null,
        },
      })
    }

    // مقاييس آخر 10 منشورات
    const meRes = await fetch(`${GRAPH}/me?fields=id,username&access_token=${igToken}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!meRes.ok) return NextResponse.json({ success: false, error: 'رمز Instagram غير صالح' }, { status: 400 })
    const meData = await meRes.json() as { id: string }

    const mediaRes = await fetch(
      `${GRAPH}/${meData.id}/media?fields=id,like_count,comments_count,media_type,timestamp,caption&limit=10&access_token=${igToken}`,
      { signal: AbortSignal.timeout(12000) }
    )
    if (!mediaRes.ok) return NextResponse.json({ success: false, error: 'تعذّر جلب المنشورات' }, { status: 400 })

    const { data: mediaList } = await mediaRes.json() as { data: Array<Record<string, unknown>> }

    const metrics = (mediaList || []).map(m => ({
      mediaId: m.id,
      likeCount: m.like_count ?? 0,
      commentsCount: m.comments_count ?? 0,
      mediaType: m.media_type,
      timestamp: m.timestamp,
      caption: typeof m.caption === 'string' ? m.caption.slice(0, 100) : null,
    }))

    const totalLikes = metrics.reduce((s, m) => s + (m.likeCount as number), 0)
    const totalComments = metrics.reduce((s, m) => s + (m.commentsCount as number), 0)

    return NextResponse.json({
      success: true,
      data: { posts: metrics, totalLikes, totalComments, postsCount: metrics.length },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ في جلب المقاييس' }, { status: 500 })
  }
}
