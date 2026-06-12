// تهيئة قاعدة البيانات - إنشاء الجداول تلقائياً
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== process.env.NEXTAUTH_SECRET && key !== 'setup2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')

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
        "lastPostId" TEXT,
        "lastPostTime" TIMESTAMP(3),
        "lastStoryId" TEXT,
        "lastStoryTime" TIMESTAMP(3),
        "followersAtLastSync" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `)

    const missingAccountCols = [
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "lastPostId" TEXT;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "lastPostTime" TIMESTAMP(3);`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "lastStoryId" TEXT;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "lastStoryTime" TIMESTAMP(3);`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "followersAtLastSync" INTEGER NOT NULL DEFAULT 0;`,
    ]
    for (const sql of missingAccountCols) {
      await prisma.$executeRawUnsafe(sql).catch(() => {})
    }

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
        "label" TEXT,
        "isUsed" BOOLEAN NOT NULL DEFAULT false,
        "maxUses" INTEGER NOT NULL DEFAULT 1,
        "usedCount" INTEGER NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP(3),
        "allowedAccounts" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "creatorId" TEXT NOT NULL,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("creatorId") REFERENCES "users"("id")
      );
    `)

    const missingReferralCols = [
      `ALTER TABLE "referral_codes" ADD COLUMN IF NOT EXISTS "label" TEXT;`,
      `ALTER TABLE "referral_codes" ADD COLUMN IF NOT EXISTS "maxUses" INTEGER NOT NULL DEFAULT 1;`,
      `ALTER TABLE "referral_codes" ADD COLUMN IF NOT EXISTS "usedCount" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "referral_codes" ADD COLUMN IF NOT EXISTS "allowedAccounts" TEXT;`,
    ]
    for (const sql of missingReferralCols) {
      await prisma.$executeRawUnsafe(sql).catch(() => {})
    }

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" TEXT NOT NULL,
        "telegramBotToken" TEXT,
        "telegramChatId" TEXT,
        "apifyApiToken" TEXT,
        "webhookUrl" TEXT,
        "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
        "notifyOnFollow" BOOLEAN NOT NULL DEFAULT true,
        "notifyOnUnfollow" BOOLEAN NOT NULL DEFAULT true,
        "notifyOnNewPost" BOOLEAN NOT NULL DEFAULT true,
        "notifyOnNewStory" BOOLEAN NOT NULL DEFAULT true,
        "notifyOnBioChange" BOOLEAN NOT NULL DEFAULT false,
        "checkIntervalMins" INTEGER NOT NULL DEFAULT 30,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id")
      );
    `)

    const missingSettingsCols = [
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "apifyApiToken" TEXT;`,
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "notifyOnNewStory" BOOLEAN NOT NULL DEFAULT true;`,
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "notifyOnBioChange" BOOLEAN NOT NULL DEFAULT false;`,
    ]
    for (const sql of missingSettingsCols) {
      await prisma.$executeRawUnsafe(sql).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: '✅ تم إنشاء جميع الجداول بنجاح! يمكنك الآن تسجيل الدخول.',
      tables: ['users', 'accounts', 'activities', 'follower_snapshots', 'referral_codes', 'settings']
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      hint: 'تحقق من DATABASE_URL في متغيرات Vercel'
    }, { status: 500 })
  }
}
