// دوال مساعدة عامة
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// دمج كلاسات Tailwind بشكل آمن
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// تنسيق الأرقام الكبيرة (1.2K, 3.5M)
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

// تنسيق التاريخ بالعربية
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// تنسيق الوقت النسبي
export function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  if (hours < 24) return `منذ ${hours} ساعة`
  if (days < 30) return `منذ ${days} يوم`
  return formatDate(date)
}

// توليد كود إحالة عشوائي
export function generateReferralCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// حساب نسبة النمو
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

// الحصول على لون حالة الحساب
export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'text-green-400'
    case 'INACTIVE': return 'text-gray-400'
    case 'ERROR': return 'text-red-400'
    case 'PENDING': return 'text-yellow-400'
    default: return 'text-gray-400'
  }
}

// الحصول على نص حالة الحساب بالعربية
export function getStatusText(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'نشط'
    case 'INACTIVE': return 'متوقف'
    case 'ERROR': return 'خطأ'
    case 'PENDING': return 'انتظار'
    default: return 'غير معروف'
  }
}

// الحصول على رمز نوع النشاط بالعربية
export function getActivityText(type: string): string {
  switch (type) {
    case 'FOLLOWER_GAIN': return 'متابعين جدد'
    case 'FOLLOWER_LOSS': return 'إلغاء متابعة'
    case 'NEW_POST': return 'منشور جديد'
    case 'PROFILE_CHANGE': return 'تغيير الملف'
    case 'STATUS_CHANGE': return 'تغيير الحالة'
    case 'ERROR': return 'خطأ'
    default: return 'نشاط'
  }
}

// توليد بيانات رسم بياني تجريبية لآخر N يوم
export function generateChartData(days: number, baseFollowers: number) {
  const data = []
  const now = new Date()
  let followers = baseFollowers

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    followers += Math.floor(Math.random() * 200 - 50)
    if (followers < 0) followers = 0

    data.push({
      date: date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
      followers,
      following: Math.floor(followers * 0.3),
      posts: Math.floor(Math.random() * 5),
    })
  }
  return data
}

// إرسال إشعار تيليجرام
export async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    )
    return response.ok
  } catch {
    return false
  }
}
