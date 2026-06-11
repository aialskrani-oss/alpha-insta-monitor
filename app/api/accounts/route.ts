// API لإدارة حسابات إنستغرام - إضافة وعرض الحسابات
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// جلب كافة الحسابات
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { activities: true } },
      },
    })

    return NextResponse.json({ success: true, data: accounts })
  } catch (error) {
    console.error('GET /api/accounts:', error)
    return NextResponse.json({ success: false, error: 'خطأ في جلب الحسابات' }, { status: 500 })
  }
}

// إضافة حساب جديد
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json()
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ success: false, error: 'اسم المستخدم مطلوب' }, { status: 400 })
    }

    const clean = username.trim().replace(/^@/, '').toLowerCase()

    if (!/^[a-zA-Z0-9._]{1,30}$/.test(clean)) {
      return NextResponse.json({ success: false, error: 'اسم مستخدم غير صالح' }, { status: 400 })
    }

    // التحقق من عدم التكرار
    const existing = await prisma.account.findUnique({ where: { username: clean } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'الحساب موجود بالفعل' }, { status: 409 })
    }

    // محاولة جلب بيانات الحساب من Instagram
    const accountData = await fetchInstagramProfile(clean)

    const account = await prisma.account.create({
      data: {
        username: clean,
        fullName: accountData?.fullName || clean,
        avatar: accountData?.avatar || null,
        bio: accountData?.bio || null,
        followers: accountData?.followers ?? 0,
        following: accountData?.following ?? 0,
        posts: accountData?.posts ?? 0,
        isTracked: true,
        status: 'ACTIVE',
        lastChecked: new Date(),
        userId: session.user.id,
      },
    })

    // تسجيل نشاط الإضافة
    await prisma.activity.create({
      data: {
        type: 'STATUS_CHANGE',
        message: `تمت إضافة الحساب @${clean} للمراقبة`,
        accountId: account.id,
      },
    })

    return NextResponse.json({ success: true, data: account }, { status: 201 })
  } catch (error) {
    console.error('POST /api/accounts:', error)
    return NextResponse.json({ success: false, error: 'خطأ في إضافة الحساب' }, { status: 500 })
  }
}

// =====================================================
// دالة جلب بيانات Instagram - تجرب طرقاً متعددة
// =====================================================
export async function fetchInstagramProfile(username: string) {
  // الطريقة 1: Instagram Internal API مع x-ig-app-id
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'x-ig-app-id': '936619743392459',
          'Accept': '*/*',
          'Accept-Language': 'ar,en;q=0.9',
          'Origin': 'https://www.instagram.com',
          'Referer': 'https://www.instagram.com/',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
        },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (res.ok) {
      const json = await res.json()
      const user = json?.data?.user
      if (user) {
        return {
          fullName: user.full_name || username,
          avatar: user.profile_pic_url_hd || user.profile_pic_url || null,
          bio: user.biography || null,
          followers: user.edge_followed_by?.count ?? 0,
          following: user.edge_follow?.count ?? 0,
          posts: user.edge_owner_to_timeline_media?.count ?? 0,
          isPrivate: user.is_private ?? false,
        }
      }
    }
  } catch {
    // تجاهل الخطأ والانتقال للطريقة التالية
  }

  // الطريقة 2: Instagram Web API القديم
  try {
    const res = await fetch(
      `https://www.instagram.com/${username}/?__a=1&__d=dis`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'ar,en-US;q=0.9',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.instagram.com/',
        },
        signal: AbortSignal.timeout(6000),
      }
    )

    if (res.ok) {
      const json = await res.json()
      const user = json?.graphql?.user
      if (user) {
        return {
          fullName: user.full_name || username,
          avatar: user.profile_pic_url_hd || user.profile_pic_url || null,
          bio: user.biography || null,
          followers: user.edge_followed_by?.count ?? 0,
          following: user.edge_follow?.count ?? 0,
          posts: user.edge_owner_to_timeline_media?.count ?? 0,
          isPrivate: user.is_private ?? false,
        }
      }
    }
  } catch {
    // تجاهل الخطأ
  }

  // الطريقة 3: استخدام proxy مجاني عبر allorigins
  try {
    const encoded = encodeURIComponent(`https://www.instagram.com/${username}/`)
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encoded}`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (res.ok) {
      const data = await res.json()
      const html: string = data?.contents || ''
      // استخراج بيانات JSON من HTML
      const match = html.match(/"edge_followed_by":\{"count":(\d+)\}/)
      const followingMatch = html.match(/"edge_follow":\{"count":(\d+)\}/)
      const postsMatch = html.match(/"edge_owner_to_timeline_media":\{"count":(\d+)\}/)
      const nameMatch = html.match(/"full_name":"([^"]+)"/)
      const bioMatch = html.match(/"biography":"([^"]*)"/)
      const picMatch = html.match(/"profile_pic_url_hd":"([^"]+)"/) ||
                       html.match(/"profile_pic_url":"([^"]+)"/)

      if (match) {
        return {
          fullName: nameMatch ? JSON.parse(`"${nameMatch[1]}"`) : username,
          avatar: picMatch ? picMatch[1].replace(/\\/g, '') : null,
          bio: bioMatch ? JSON.parse(`"${bioMatch[1]}"`) : null,
          followers: match ? parseInt(match[1]) : 0,
          following: followingMatch ? parseInt(followingMatch[1]) : 0,
          posts: postsMatch ? parseInt(postsMatch[1]) : 0,
          isPrivate: false,
        }
      }
    }
  } catch {
    // تجاهل الخطأ
  }

  // كل الطرق فشلت - إرجاع null
  return null
}
