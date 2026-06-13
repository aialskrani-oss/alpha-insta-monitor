// بروكسي لصور Instagram لتجاوز CORS وحماية رموز الوصول
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// الأنواع المسموح بها لتجنب إساءة الاستخدام
const ALLOWED_HOSTS = [
  'instagram.com',
  'cdninstagram.com',
  'fbcdn.net',
  'scontent',
  'lookaside.instagram.com',
  'lookaside.fbsbx.com',
]

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_HOSTS.some(h => parsed.hostname.includes(h))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // التحقق من المضيف المسموح به
  if (!isAllowedUrl(url)) {
    return new NextResponse('Forbidden host', { status: 403 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlphaMonitor/1.0)',
        'Referer': 'https://www.instagram.com/',
      },
      // لا نُرسل cookies للخارج
    })

    if (!response.ok) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch image', { status: 500 })
  }
}
