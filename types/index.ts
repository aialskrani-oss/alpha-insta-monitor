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
    lastPostId?: string
    lastPostTime?: string
    lastStoryId?: string
    lastStoryTime?: string
    followersAtLastSync?: number
    createdAt: string
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
    checkIntervalMins: number
  }

  export interface DashboardStats {
    totalAccounts: number
    trackedAccounts: number
    totalFollowers: number
    totalFollowing: number
    totalPosts: number
    followerGrowth?: number
    recentActivities: Activity[]
  }
  