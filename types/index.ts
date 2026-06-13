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
  avatar?: string | null
  bio?: string | null
  followers: number
  following: number
  posts: number
  isTracked: boolean
  isPrivate: boolean
  isVerified: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING'
  lastChecked?: string | null
  lastPostId?: string | null
  lastPostTime?: string | null
  lastStoryId?: string | null
  lastStoryTime?: string | null
  lastActivityTime?: string | null
  activeStoryIds?: string | null
  followersAtLastSync?: number
  // إشعارات مخصصة (null = استخدم الإعداد العام)
  notifyOnFollow?: boolean | null
  notifyOnUnfollow?: boolean | null
  notifyOnNewPost?: boolean | null
  notifyOnNewStory?: boolean | null
  notifyOnBioChange?: boolean | null
  // حقول المراقبة المتطورة
  lastPostDetectedAt?: string | null
  lastReelDetectedAt?: string | null
  lastBioChangeAt?: string | null
  lastPpChangeAt?: string | null
  lastVisibilityChangeAt?: string | null
  bioHistory?: Array<{ bio: string | null; changedAt: string }> | null
  ppHistory?: Array<{ url: string | null; changedAt: string }> | null
  createdAt: string
  updatedAt?: string
  userId: string
}

export interface Activity {
  id: string
  type: 'FOLLOWER_GAIN' | 'FOLLOWER_LOSS' | 'NEW_POST' | 'NEW_STORY' | 'PROFILE_CHANGE' | 'STATUS_CHANGE' | 'ERROR'
  message: string
  data?: Record<string, unknown>
  createdAt: string
  accountId: string
  account?: {
    username: string
    avatar?: string | null
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

export interface FollowerChange {
  id: string
  oldCount: number
  newCount: number
  change: number
  recordedAt: string
  accountId: string
  account?: {
    username: string
    avatar?: string | null
  }
}

export interface AdvancedMetrics {
  mediaId: string
  likeCount: number
  commentsCount: number
  mediaType: string
  timestamp: string
  caption?: string | null
  reach?: number | null
  saved?: number | null
  videoViews?: number | null
}

export interface Comment {
  id: string
  commentId: string
  mediaId: string
  text: string
  timestamp: string
  mediaOwner?: string | null
  createdAt: string
  accountId: string
  account?: {
    username: string
    avatar?: string | null
  }
}

export interface ReferralCode {
  id: string
  code: string
  label?: string | null
  isUsed: boolean
  maxUses: number
  usedCount: number
  expiresAt?: string | null
  allowedAccounts?: string | null
  createdAt: string
  creatorId: string
}

export interface Settings {
  id: string
  telegramBotToken?: string | null
  telegramChatId?: string | null
  apifyApiToken?: string | null
  webhookUrl?: string | null
  webhookEnabled: boolean
  notifyOnFollow: boolean
  notifyOnUnfollow: boolean
  notifyOnNewPost: boolean
  notifyOnNewStory: boolean
  notifyOnBioChange: boolean
  notifyOnPrivate: boolean
  checkIntervalMins: number
}

export interface TopAccount {
  id: string
  username: string
  fullName?: string | null
  avatar?: string | null
  followers: number
  following: number
  posts: number
  isTracked: boolean
  isPrivate: boolean
  isVerified: boolean
  status: string
}

export interface DashboardStats {
  totalAccounts: number
  trackedAccounts: number
  totalFollowers: number
  totalFollowing: number
  totalPosts: number
  followerGrowth?: number
  recentActivities: Activity[]
  topAccounts?: TopAccount[]
}
