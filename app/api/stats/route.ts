// API إحصائيات لوحة التحكم
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const userId = session.user.id

    // جلب الإحصائيات الأساسية
    const [accounts, activities] = await Promise.all([
      prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          followers: true,
          following: true,
          posts: true,
          isTracked: true,
          status: true,
        },
      }),
      prisma.activity.findMany({
        where: {
          account: { userId },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          account: {
            select: { username: true, avatar: true },
          },
        },
      }),
    ])

    const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0)
    const totalFollowing = accounts.reduce((sum, a) => sum + a.following, 0)
    const totalPosts = accounts.reduce((sum, a) => sum + a.posts, 0)
    const trackedAccounts = accounts.filter((a) => a.isTracked).length

    // حساب نمو تجريبي (في المشروع الحقيقي يُحسب من الـ snapshots)
    const followerGrowth = accounts.length > 0 ? Math.floor(Math.random() * 15 - 3) : 0

    return NextResponse.json({
      success: true,
      data: {
        totalAccounts: accounts.length,
        trackedAccounts,
        totalFollowers,
        totalFollowing,
        totalPosts,
        followerGrowth,
        recentActivities: activities,
        topAccounts: accounts
          .sort((a, b) => b.followers - a.followers)
          .slice(0, 5),
      },
    })
  } catch (error) {
    console.error('GET /api/stats:', error)
    return NextResponse.json({ success: false, error: 'خطأ في جلب الإحصائيات' }, { status: 500 })
  }
}
