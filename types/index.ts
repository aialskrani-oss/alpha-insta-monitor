// أنواع TypeScript الرئيسية للمشروع

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
}

export interface Account {
  id: string
  username: string
  fullName?: string
  avatar?: string
  bio?: string
  followers: number
  following: number
  posts: number
  isTracked: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING'
  lastChecked?: string
  createdAt: string
  userId: string
}

export interface Activity {
  id: string
  type: 'FOLLOWER_GAIN' | 'FOLLOWER_LOSS' | 'NEW_POST' | 'PROFILE_CHANGE' | 'STATUS_CHANGE' | 'ERROR'
  message: string
  data?: Record<string, unknown>
  createdAt: string
  accountId: string
  account?: {
    username: string
    avatar?: string
  }
}

export interface FollowerSnapshot {
  id: string
  followers: number
  following: number
  posts: number
  recordedAt: string
  accountId: string
}

export interface ReferralCode {
  id: string
  code: string
  isUsed: boolean
  expiresAt?: string
  createdAt: string
  creatorId: string
}

export interface Settings {
  id: string
  telegramBotToken?: string
  telegramChatId?: string
  webhookUrl?: string
  webhookEnabled: boolean
  notifyOnFollow: boolean
  notifyOnUnfollow: boolean
  notifyOnNewPost: boolean
  checkIntervalMins: number
}

// إحصائيات لوحة التحكم
export interface DashboardStats {
  totalAccounts: number
  trackedAccounts: number
  totalFollowers: number
  totalFollowing: number
  totalPosts: number
  followerGrowth: number
  recentActivities: Activity[]
  topAccounts: Account[]
}

// بيانات الرسم البياني
export interface ChartDataPoint {
  date: string
  followers: number
  following: number
  posts: number
}

// نموذج إضافة حساب
export interface AddAccountForm {
  username: string
}

// نموذج الإعدادات
export interface SettingsForm {
  telegramBotToken?: string
  telegramChatId?: string
  webhookUrl?: string
  webhookEnabled?: boolean
  notifyOnFollow?: boolean
  notifyOnUnfollow?: boolean
  notifyOnNewPost?: boolean
  checkIntervalMins?: number
}

// استجابة API العامة
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// خصائص الأيقونات
export interface IconProps {
  className?: string
  size?: number
}
