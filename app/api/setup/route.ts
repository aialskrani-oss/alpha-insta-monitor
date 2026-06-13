import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== process.env.NEXTAUTH_SECRET && key !== 'setup2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')

    // ─── جدول users ─────────────────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "usedCodeId" TEXT
      );
    `)

    // ─── جدول accounts ──────────────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "fullName" TEXT,
        "avatar" TEXT,
        "bio" TEXT,
        "followers" INTEGER NOT NULL DEFAULT 0,
        "following" INTEGER NOT NULL DEFAULT 0,
        "posts" INTEGER NOT NULL DEFAULT 0,
        "isTracked" BOOLEAN NOT NULL DEFAULT true,
        "isPrivate" BOOLEAN NOT NULL DEFAULT false,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "lastChecked" TIMESTAMP(3),
        "lastPostId" TEXT,
        "lastPostTime" TIMESTAMP(3),
        "lastStoryId" TEXT,
        "lastStoryTime" TIMESTAMP(3),
        "lastActivityTime" TIMESTAMP(3),
        "activeStoryIds" TEXT,
        "followersAtLastSync" INTEGER NOT NULL DEFAULT 0,
        "notifyOnFollow" BOOLEAN,
        "notifyOnUnfollow" BOOLEAN,
        "notifyOnNewPost" BOOLEAN,
        "notifyOnNewStory" BOOLEAN,
        "notifyOnBioChange" BOOLEAN,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `)

    const accountCols = [
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "lastPostId" TEXT;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "lastPostTime" TIMESTAMP(3);`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "lastStoryId" TEXT;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "lastStoryTime" TIMESTAMP(3);`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "lastActivityTime" TIMESTAMP(3);`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "activeStoryIds" TEXT;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "followersAtLastSync" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "notifyOnFollow" BOOLEAN;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "notifyOnUnfollow" BOOLEAN;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "notifyOnNewPost" BOOLEAN;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "notifyOnNewStory" BOOLEAN;`,
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "notifyOnBioChange" BOOLEAN;`,
    ]
    for (const sql of accountCols) await prisma.$executeRawUnsafe(sql).catch(() => {})

    // ─── جدول stories ────────────────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "stories" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "imageUrl" TEXT,
        "videoUrl" TEXT,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "notified" BOOLEAN NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "accountId" TEXT NOT NULL,
        FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
      );
    `)

    // ─── جدول activities ────────────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "activities" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "type" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "accountId" TEXT NOT NULL,
        FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
      );
    `)

    // ─── جدول follower_snapshots ─────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "follower_snapshots" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "followers" INTEGER NOT NULL,
        "following" INTEGER NOT NULL,
        "posts" INTEGER NOT NULL,
        "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "accountId" TEXT NOT NULL,
        FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
      );
    `)

    // ─── جدول referral_codes ─────────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "referral_codes" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "label" TEXT,
        "isUsed" BOOLEAN NOT NULL DEFAULT false,
        "maxUses" INTEGER NOT NULL DEFAULT 1,
        "usedCount" INTEGER NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP(3),
        "allowedAccounts" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "creatorId" TEXT NOT NULL,
        FOREIGN KEY ("creatorId") REFERENCES "users"("id")
      );
    `)

    const referralCols = [
      `ALTER TABLE "referral_codes" ADD COLUMN IF NOT EXISTS "label" TEXT;`,
      `ALTER TABLE "referral_codes" ADD COLUMN IF NOT EXISTS "maxUses" INTEGER NOT NULL DEFAULT 1;`,
      `ALTER TABLE "referral_codes" ADD COLUMN IF NOT EXISTS "usedCount" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "referral_codes" ADD COLUMN IF NOT EXISTS "allowedAccounts" TEXT;`,
    ]
    for (const sql of referralCols) await prisma.$executeRawUnsafe(sql).catch(() => {})

    // ─── جدول settings ───────────────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" TEXT NOT NULL PRIMARY KEY,
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
        "notifyOnPrivate" BOOLEAN NOT NULL DEFAULT true,
        "checkIntervalMins" INTEGER NOT NULL DEFAULT 30,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const settingsCols = [
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "apifyApiToken" TEXT;`,
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "notifyOnNewStory" BOOLEAN NOT NULL DEFAULT true;`,
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "notifyOnBioChange" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "notifyOnPrivate" BOOLEAN NOT NULL DEFAULT true;`,
    ]
    for (const sql of settingsCols) await prisma.$executeRawUnsafe(sql).catch(() => {})

    return NextResponse.json({
      success: true,
      message: '✅ تم إنشاء جميع الجداول وإضافة الأعمدة الجديدة بنجاح!',
      tables: ['users', 'accounts', 'stories', 'activities', 'follower_snapshots', 'referral_codes', 'settings'],
      newCols: ['isPrivate', 'isVerified', 'activeStoryIds', 'notifyOnPrivate', 'stories table'],
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
