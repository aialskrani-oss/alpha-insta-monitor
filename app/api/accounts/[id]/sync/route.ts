// API مزامنة بيانات حساب واحد من Instagram
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchInstagramProfile } from '../../route'

export async function POST(
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

    // جلب أحدث بيانات من Instagram
    const fresh = await fetchInstagramProfile(account.username)

    if (!fresh) {
      // تحديث وقت آخر فحص حتى لو فشل الجلب
      await prisma.account.update({
        where: { id: params.id },
        data: { lastChecked: new Date() },
      })
      return NextResponse.json({
        success: false,
        error: 'تعذّر الاتصال بـ Instagram — سيتم إعادة المحاولة لاحقاً',
        partial: true,
      }, { status: 200 })
    }

    // مقارنة التغييرات وتسجيل نشاطات
    const activities: Array<{ type: string; message: string }> = []

    const followerDiff = (fresh.followers ?? 0) - account.followers
    if (followerDiff !== 0) {
      activities.push({
        type: followerDiff > 0 ? 'FOLLOWER_GAIN' : 'FOLLOWER_LOSS',
        message: followerDiff > 0
          ? `اكتسب @${account.username} ${Math.abs(followerDiff)} متابع جديد`
          : `فقد @${account.username} ${Math.abs(followerDiff)} متابع`,
      })
    }

    const postDiff = (fresh.posts ?? 0) - account.posts
    if (postDiff > 0) {
      activities.push({
        type: 'NEW_POST',
        message: `نشر @${account.username} ${postDiff} منشور جديد`,
      })
    }

    // تحديث بيانات الحساب
    const updated = await prisma.account.update({
      where: { id: params.id },
      data: {
        fullName: fresh.fullName || account.fullName,
        avatar: fresh.avatar ?? account.avatar,
        bio: fresh.bio ?? account.bio,
        followers: fresh.followers ?? account.followers,
        following: fresh.following ?? account.following,
        posts: fresh.posts ?? account.posts,
        lastChecked: new Date(),
      },
    })

    // حفظ snapshot للتحليلات
    await prisma.followerSnapshot.create({
      data: {
        followers: fresh.followers ?? 0,
        following: fresh.following ?? 0,
        posts: fresh.posts ?? 0,
        accountId: params.id,
      },
    })

    // حفظ النشاطات
    if (activities.length > 0) {
      await prisma.activity.createMany({
        data: activities.map((a) => ({ ...a, accountId: params.id })),
      })
    }

    return NextResponse.json({
      success: true,
      data: updated,
      changes: activities.length,
      message: activities.length > 0
        ? `تم رصد ${activities.length} تغيير`
        : 'لا توجد تغييرات',
    })
  } catch (error) {
    console.error('POST /api/accounts/[id]/sync:', error)
    return NextResponse.json({ success: false, error: 'خطأ أثناء المزامنة' }, { status: 500 })
  }
}
