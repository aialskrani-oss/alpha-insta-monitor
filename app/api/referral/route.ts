// API أكواد الإحالة
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReferralCode } from '@/lib/utils'

// جلب كافة الأكواد (للمشرف فقط)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح - مشرفون فقط' }, { status: 403 })
    }

    const codes = await prisma.referralCode.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: codes })
  } catch (error) {
    console.error('GET /api/referral:', error)
    return NextResponse.json({ success: false, error: 'خطأ في جلب الأكواد' }, { status: 500 })
  }
}

// إنشاء كود إحالة جديد
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح - مشرفون فقط' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { expiresInDays } = body

    let expiresAt: Date | undefined
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays))
    }

    // توليد كود فريد
    let code = generateReferralCode()
    let attempts = 0
    while (attempts < 10) {
      const exists = await prisma.referralCode.findUnique({ where: { code } })
      if (!exists) break
      code = generateReferralCode()
      attempts++
    }

    const referralCode = await prisma.referralCode.create({
      data: {
        code,
        creatorId: session.user.id,
        ...(expiresAt && { expiresAt }),
      },
    })

    return NextResponse.json({ success: true, data: referralCode }, { status: 201 })
  } catch (error) {
    console.error('POST /api/referral:', error)
    return NextResponse.json({ success: false, error: 'خطأ في إنشاء الكود' }, { status: 500 })
  }
}

// حذف كود إحالة
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    const { id } = await req.json()
    await prisma.referralCode.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/referral:', error)
    return NextResponse.json({ success: false, error: 'خطأ في حذف الكود' }, { status: 500 })
  }
}
