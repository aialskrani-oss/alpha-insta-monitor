// API لإدارة حساب بعينه - تحديث وحذف
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const body = await req.json()
    const {
      isTracked, status, followers, following, posts,
      notifyOnFollow, notifyOnUnfollow, notifyOnNewPost, notifyOnNewStory, notifyOnBioChange,
    } = body

    const account = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })

    const updateData: Record<string, unknown> = {}
    if (isTracked !== undefined) updateData.isTracked = isTracked
    if (status !== undefined) updateData.status = status
    if (followers !== undefined) updateData.followers = Number(followers)
    if (following !== undefined) updateData.following = Number(following)
    if (posts !== undefined) updateData.posts = Number(posts)

    // إشعارات مخصصة — null يعني "استخدم الإعداد العام"
    if (notifyOnFollow !== undefined) updateData.notifyOnFollow = notifyOnFollow  // true | false | null
    if (notifyOnUnfollow !== undefined) updateData.notifyOnUnfollow = notifyOnUnfollow
    if (notifyOnNewPost !== undefined) updateData.notifyOnNewPost = notifyOnNewPost
    if (notifyOnNewStory !== undefined) updateData.notifyOnNewStory = notifyOnNewStory
    if (notifyOnBioChange !== undefined) updateData.notifyOnBioChange = notifyOnBioChange

    const updated = await prisma.account.update({
      where: { id: params.id },
      data: updateData,
    })

    if (isTracked !== undefined) {
      await prisma.activity.create({
        data: {
          type: 'STATUS_CHANGE',
          message: isTracked ? `تم تشغيل مراقبة @${account.username}` : `تم إيقاف مراقبة @${account.username}`,
          accountId: params.id,
        },
      })
    }

    if (followers !== undefined || following !== undefined || posts !== undefined) {
      await prisma.followerSnapshot.create({
        data: {
          followers: Number(followers ?? account.followers),
          following: Number(following ?? account.following),
          posts: Number(posts ?? account.posts),
          accountId: params.id,
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في تحديث الحساب' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const account = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })

    await prisma.account.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ في حذف الحساب' }, { status: 500 })
  }
}
