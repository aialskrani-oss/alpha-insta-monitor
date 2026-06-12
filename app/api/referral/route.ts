// API أكواد الإحالة
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReferralCode } from '@/lib/utils'

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
    return NextResponse.json({ success: false, error: 'خطأ في جلب الأكواد' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح - مشرفون فقط' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { expiresInDays, label, maxUses, allowedAccounts } = body

    let expiresAt: Date | undefined
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays))
    }

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
        label: label || null,
        maxUses: maxUses ? Number(maxUses) : 1,
        usedCount: 0,
        allowedAccounts: allowedAccounts ? JSON.stringify(allowedAccounts) : null,
        ...(expiresAt && { expiresAt }),
      },
    })

    return NextResponse.json({ success: true, data: referralCode }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في إنشاء الكود' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    const body = await req.json()
    const { id, label, maxUses, expiresAt, allowedAccounts } = body

    const updated = await prisma.referralCode.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(maxUses !== undefined && { maxUses: Number(maxUses) }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(allowedAccounts !== undefined && { allowedAccounts: allowedAccounts ? JSON.stringify(allowedAccounts) : null }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في تحديث الكود' }, { status: 500 })
  }
}

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
    return NextResponse.json({ success: false, error: 'خطأ في حذف الكود' }, { status: 500 })
  }
}
