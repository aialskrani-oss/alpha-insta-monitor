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

    // محاولة جلب بيانات الحساب من Instagram (بدون API رسمي - بيانات أولية)
    const accountData = await fetchInstagramBasicInfo(clean)

    const account = await prisma.account.create({
      data: {
        username: clean,
        fullName: accountData?.fullName || clean,
        avatar: accountData?.avatar,
        followers: accountData?.followers || 0,
        following: accountData?.following || 0,
        posts: accountData?.posts || 0,
        isTracked: true,
        status: 'ACTIVE',
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

// جلب معلومات أساسية من إنستغرام (غير رسمي)
async function fetchInstagramBasicInfo(username: string) {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return null
    const data = await res.json()
    const user = data?.graphql?.user

    if (!user) return null

    return {
      fullName: user.full_name || username,
      avatar: user.profile_pic_url_hd || user.profile_pic_url,
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      posts: user.edge_owner_to_timeline_media?.count || 0,
    }
  } catch {
    return null
  }
}
