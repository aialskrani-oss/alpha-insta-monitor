// تهيئة قاعدة البيانات - إنشاء الجداول تلقائياً
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // حماية بسيطة - يجب تمرير مفتاح سري
  const key = req.nextUrl.searchParams.get('key')
  if (key !== process.env.NEXTAUTH_SECRET && key !== 'setup2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')

    // تشغيل SQL لإنشاء كل الجداول إذا لم تكن موجودة
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "usedCodeId" TEXT,
        PRIMARY KEY ("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id" TEXT NOT NULL,
        "username" TEXT NOT NULL UNIQUE,
        "fullName" TEXT,
        "avatar" TEXT,
        "bio" TEXT,
        "followers" INTEGER NOT NULL DEFAULT 0,
        "following" INTEGER NOT NULL DEFAULT 0,
        "posts" INTEGER NOT NULL DEFAULT 0,
        "isTracked" BOOLEAN NOT NULL DEFAULT true,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "lastChecked" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "activities" (
        "id" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "accountId" TEXT NOT NULL,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "follower_snapshots" (
        "id" TEXT NOT NULL,
        "followers" INTEGER NOT NULL,
        "following" INTEGER NOT NULL,
        "posts" INTEGER NOT NULL,
        "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "accountId" TEXT NOT NULL,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "referral_codes" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL UNIQUE,
        "isUsed" BOOLEAN NOT NULL DEFAULT false,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "creatorId" TEXT NOT NULL,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("creatorId") REFERENCES "users"("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" TEXT NOT NULL,
        "telegramBotToken" TEXT,
        "telegramChatId" TEXT,
        "webhookUrl" TEXT,
        "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
        "notifyOnFollow" BOOLEAN NOT NULL DEFAULT true,
        "notifyOnUnfollow" BOOLEAN NOT NULL DEFAULT true,
        "notifyOnNewPost" BOOLEAN NOT NULL DEFAULT true,
        "checkIntervalMins" INTEGER NOT NULL DEFAULT 60,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id")
      );
    `)

    // إضافة عمود updatedAt trigger
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `).catch(() => {})

    return NextResponse.json({
      success: true,
      message: '✅ تم إنشاء جميع الجداول بنجاح! يمكنك الآن تسجيل الدخول.',
      tables: ['users', 'accounts', 'activities', 'follower_snapshots', 'referral_codes', 'settings']
    })
  } catch (error) {
    const msg = String(error)
    return NextResponse.json({
      success: false,
      error: msg,
      hint: 'تحقق من DATABASE_URL في متغيرات Vercel'
    }, { status: 500 })
  }
}
