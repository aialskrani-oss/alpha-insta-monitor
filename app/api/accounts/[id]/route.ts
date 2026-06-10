// API لإدارة حساب بعينه - تحديث وحذف
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// تحديث حساب (إيقاف/تشغيل المراقبة)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json()
    const { isTracked, status } = body

    const account = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!account) {
      return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })
    }

    const updated = await prisma.account.update({
      where: { id: params.id },
      data: {
        ...(isTracked !== undefined && { isTracked }),
        ...(status !== undefined && { status }),
      },
    })

    // تسجيل نشاط التغيير
    await prisma.activity.create({
      data: {
        type: 'STATUS_CHANGE',
        message: isTracked !== undefined
          ? `تم ${isTracked ? 'تشغيل' : 'إيقاف'} مراقبة @${account.username}`
          : `تم تحديث حساب @${account.username}`,
        accountId: params.id,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/accounts/[id]:', error)
    return NextResponse.json({ success: false, error: 'خطأ في تحديث الحساب' }, { status: 500 })
  }
}

// حذف حساب
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const account = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!account) {
      return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })
    }

    await prisma.account.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' })
  } catch (error) {
    console.error('DELETE /api/accounts/[id]:', error)
    return NextResponse.json({ success: false, error: 'خطأ في حذف الحساب' }, { status: 500 })
  }
}
