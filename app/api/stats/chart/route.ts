// API بيانات الرسم البياني الحقيقية من snapshots
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const days = parseInt(req.nextUrl.searchParams.get('days') || '7')
    const accountId = req.nextUrl.searchParams.get('accountId') || null

    const since = new Date()
    since.setDate(since.getDate() - days)

    const snapshots = await prisma.followerSnapshot.findMany({
      where: {
        account: { userId: session.user.id, ...(accountId ? { id: accountId } : {}) },
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
      include: { account: { select: { username: true } } },
    })

    // تجميع البيانات حسب اليوم — مجموع كل الحسابات
    const byDay = new Map<string, { followers: number; following: number; posts: number; count: number }>()

    // أنشئ خانة لكل يوم في النطاق
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
      byDay.set(key, { followers: 0, following: 0, posts: 0, count: 0 })
    }

    // اجمع الـ snapshots في اليوم المناسب
    for (const snap of snapshots) {
      const key = new Date(snap.recordedAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
      const existing = byDay.get(key)
      if (existing) {
        // بدل التجميع: نأخذ أحدث snapshot لكل حساب في اليوم
        existing.followers += snap.followers
        existing.following += snap.following
        existing.posts += snap.posts
        existing.count += 1
        byDay.set(key, existing)
      }
    }

    const data = Array.from(byDay.entries()).map(([date, d]) => ({
      date,
      followers: d.count > 0 ? d.followers : null,
      following: d.count > 0 ? d.following : null,
      posts: d.count > 0 ? d.posts : null,
    }))

    return NextResponse.json({ success: true, data, hasRealData: snapshots.length > 0 })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
