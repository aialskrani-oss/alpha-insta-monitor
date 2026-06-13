// Proxy صور Instagram لتجاوز CORS
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return new NextResponse(null, { status: 400 })
  }

  // تحقق أن الرابط من Instagram CDN أو مصادر موثوقة فقط
  const allowedHosts = [
    'instagram.com', 'cdninstagram.com', 'fbcdn.net',
    'scontent', 'lookaside.fbsbx.com', 'static.cdninstagram.com',
  ]
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  const isAllowed = allowedHosts.some(h => parsedUrl.hostname.includes(h))
  if (!isAllowed) {
    return new NextResponse(null, { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram/295.0',
        'Accept': 'image/webp,image/avif,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.instagram.com/',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return new NextResponse(null, { status: res.status })
    }

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=7200, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
