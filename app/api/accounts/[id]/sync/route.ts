// API مزامنة يدوية لحساب واحد
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchInstagramProfile } from '@/lib/instagram'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

    const account = await prisma.account.findFirst({ where: { id: params.id, userId: session.user.id } })
    if (!account) return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })

    const settings = await prisma.settings.findFirst()
    const apifyToken = settings?.apifyApiToken || process.env.APIFY_API_TOKEN || null
    if (!apifyToken) {
      return NextResponse.json({ success: false, error: 'يجب إضافة Apify API Token في الإعدادات أولاً', needsSetup: true })
    }

    const fresh = await fetchInstagramProfile(account.username, apifyToken)
    if (!fresh) {
      await prisma.account.update({ where: { id: params.id }, data: { lastChecked: new Date() } })
      return NextResponse.json({ success: false, error: 'تعذّر الاتصال بـ Instagram' })
    }

    const updated = await prisma.account.update({
      where: { id: params.id },
      data: { fullName: fresh.fullName || account.fullName, avatar: fresh.avatar ?? account.avatar, bio: fresh.bio ?? account.bio, followers: fresh.followers, following: fresh.following, posts: fresh.posts, lastChecked: new Date() },
    })

    await prisma.followerSnapshot.create({
      data: { followers: fresh.followers, following: fresh.following, posts: fresh.posts, accountId: params.id },
    })

    const followerDiff = fresh.followers - account.followers
    if (followerDiff !== 0) {
      await prisma.activity.create({
        data: { type: followerDiff > 0 ? 'FOLLOWER_GAIN' : 'FOLLOWER_LOSS', message: followerDiff > 0 ? `@${account.username} اكتسب +${followerDiff} متابع` : `@${account.username} فقد ${Math.abs(followerDiff)} متابع`, accountId: params.id },
      })
    }

    return NextResponse.json({ success: true, data: updated, message: `✅ ${fresh.followers.toLocaleString('ar')} متابع` })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ أثناء المزامنة' }, { status: 500 })
  }
}
