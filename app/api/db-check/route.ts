// تهيئة قاعدة البيانات - يُستدعى تلقائياً
  import { NextResponse } from 'next/server'
  import { prisma } from '@/lib/prisma'

  export async function GET() {
    try {
      // التحقق من الاتصال بقاعدة البيانات
      await prisma.$executeRaw`SELECT 1`
      return NextResponse.json({ success: true, message: 'قاعدة البيانات تعمل بشكل صحيح ✅' })
    } catch (error) {
      return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
  }
  