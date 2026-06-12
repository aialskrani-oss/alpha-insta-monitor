// API لجلب snapshots حساب بعينه للرسم البياني
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const account = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id }
    })
    if (!account) return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })

    const snapshots = await prisma.followerSnapshot.findMany({
      where: { accountId: params.id },
      orderBy: { recordedAt: 'asc' },
      take: 90,
    })

    return NextResponse.json({ success: true, data: snapshots })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ' }, { status: 500 })
  }
}
