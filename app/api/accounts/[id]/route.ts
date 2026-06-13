// GET حساب محدد بواسطة ID
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const account = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })

    return NextResponse.json({ success: true, data: account })
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ في جلب الحساب' }, { status: 500 })
  }
}
