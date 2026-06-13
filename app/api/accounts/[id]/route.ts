// API حساب واحد: GET + PATCH + DELETE
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: { id: string } }

// ── GET: جلب حساب واحد ──────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
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

// ── PATCH: تعديل حساب (تتبع، إشعارات، بيانات يدوية) ───────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const account = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })

    const body = await req.json().catch(() => ({}))

    // حقول مسموح بتعديلها
    const allowed = [
      'isTracked', 'status',
      'followers', 'following', 'posts',
      'notifyOnFollow', 'notifyOnUnfollow',
      'notifyOnNewPost', 'notifyOnNewStory',
      'notifyOnBioChange',
    ]

    const updateData: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updateData[key] = body[key]
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'لا توجد بيانات للتعديل' }, { status: 400 })
    }

    const updated = await prisma.account.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ في تعديل الحساب' }, { status: 500 })
  }
}

// ── DELETE: حذف حساب وجميع بياناته ─────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const account = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })

    await prisma.account.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: `تم حذف @${account.username}` })
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ في حذف الحساب' }, { status: 500 })
  }
}
