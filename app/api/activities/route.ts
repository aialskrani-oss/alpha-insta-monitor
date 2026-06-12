// API لإدارة سجل النشاطات - حذف السجل
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const accountId = req.nextUrl.searchParams.get('accountId')
    const limit = Number(req.nextUrl.searchParams.get('limit') || '50')

    const where = accountId
      ? { accountId, account: { userId: session.user.id } }
      : { account: { userId: session.user.id } }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: { account: { select: { username: true, avatar: true } } }
    })

    return NextResponse.json({ success: true, data: activities })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const { accountId } = await req.json().catch(() => ({}))

    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId: session.user.id }
      })
      if (!account) return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })
      await prisma.activity.deleteMany({ where: { accountId } })
    } else {
      const userAccounts = await prisma.account.findMany({
        where: { userId: session.user.id },
        select: { id: true }
      })
      const ids = userAccounts.map(a => a.id)
      await prisma.activity.deleteMany({ where: { accountId: { in: ids } } })
    }

    return NextResponse.json({ success: true, message: 'تم مسح السجل' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في المسح' }, { status: 500 })
  }
}
