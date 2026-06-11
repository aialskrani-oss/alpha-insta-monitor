// API لإدارة حسابات إنستغرام - إضافة وعرض الحسابات
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchInstagramProfile } from '@/lib/instagram'

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
        avatar: accountData?.avatar ?? null,
        bio: accountData?.bio ?? null,
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
