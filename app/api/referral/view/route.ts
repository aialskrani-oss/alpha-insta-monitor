// API عرض عام بكود إحالة - قراءة فقط بدون مصادقة
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.json({ success: false, error: 'كود الإحالة مطلوب' }, { status: 400 })
    }

    const referral = await prisma.referralCode.findUnique({ where: { code } })

    if (!referral) {
      return NextResponse.json({ success: false, error: 'كود الإحالة غير موجود' }, { status: 404 })
    }

    if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'انتهت صلاحية كود الإحالة', expired: true }, { status: 403 })
    }

    if (referral.usedCount >= referral.maxUses) {
      return NextResponse.json({ success: false, error: 'تم استخدام كود الإحالة بالكامل', maxed: true }, { status: 403 })
    }

    // تحديد الحسابات المسموح بها
    let allowedIds: string[] | null = null
    if (referral.allowedAccounts) {
      try {
        allowedIds = JSON.parse(referral.allowedAccounts)
      } catch { allowedIds = null }
    }

    const whereClause = allowedIds && allowedIds.length > 0
      ? { id: { in: allowedIds }, isTracked: true }
      : { isTracked: true }

    const accounts = await prisma.account.findMany({
      where: whereClause,
      orderBy: { followers: 'desc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        bio: true,
        followers: true,
        following: true,
        posts: true,
        status: true,
        lastChecked: true,
        lastPostTime: true,
        lastStoryTime: true,
        createdAt: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            message: true,
            data: true,
            createdAt: true,
            accountId: true,
          }
        },
        snapshots: {
          orderBy: { recordedAt: 'desc' },
          take: 30,
          select: {
            id: true,
            followers: true,
            following: true,
            posts: true,
            recordedAt: true,
            accountId: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        referral: {
          label: referral.label,
          expiresAt: referral.expiresAt,
          maxUses: referral.maxUses,
          usedCount: referral.usedCount,
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في جلب البيانات' }, { status: 500 })
  }
}
