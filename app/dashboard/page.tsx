'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Users, UserCheck, TrendingUp, FileText,
  RefreshCw, Activity, Lock, Clock, Star,
  MessageCircle, ChevronDown, ChevronUp, AlertCircle, Loader2,
} from 'lucide-react'
import { StatsCard }     from '@/components/dashboard/StatsCard'
import { MonitorChart }  from '@/components/dashboard/MonitorChart'
import RecentActivity    from '@/components/dashboard/RecentActivity'
import { formatNumber, timeAgo } from '@/lib/utils'
import type { DashboardStats, Comment } from '@/types'

function avatarSrc(url?: string | null) {
  if (!url) return null
  return `/api/proxy/image?url=${encodeURIComponent(url)}`
}

function CommentCard({ comment }: { comment: Comment }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-cyber-border last:border-0">
      <div className="w-7 h-7 rounded-full ig-gradient flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
        {(comment.mediaOwner || comment.account?.username || '؟')[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-ig-purple">
            @{comment.mediaOwner || comment.account?.username}
          </span>
          <span className="text-[10px] text-gray-600">
            {timeAgo(comment.timestamp)}
          </span>
        </div>
        <p className="text-sm text-cyber-text leading-relaxed break-words">{comment.text}</p>
        <p className="text-[10px] text-gray-600 mt-0.5 font-mono truncate">
          منشور: {comment.mediaId}
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats,    setStats]    = useState<DashboardStats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // حالة التعليقات
  const [comments,        setComments]        = useState<Comment[]>([])
  const [commentsOpen,    setCommentsOpen]    = useState(false)
  const [commentsFetching, setCommentsFetching] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError,   setCommentsError]   = useState<string | null>(null)
  const [fetchResult,     setFetchResult]     = useState<{
    postsChecked: number; commentsFetched: number; commentsSaved: number; account: string
  } | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) { setStats(data.data); setLastSync(new Date()) }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // جلب التعليقات المخزّنة
  const loadStoredComments = useCallback(async () => {
    setCommentsLoading(true)
    setCommentsError(null)
    try {
      const res  = await fetch('/api/instagram/comments?limit=50')
      const data = await res.json()
      if (data.success) {
        setComments(data.data)
      } else {
        setCommentsError(data.error || 'تعذّر جلب التعليقات')
      }
    } catch {
      setCommentsError('خطأ في الاتصال')
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  // فتح قسم التعليقات
  const handleToggleComments = () => {
    if (!commentsOpen && comments.length === 0) {
      loadStoredComments()
    }
    setCommentsOpen(prev => !prev)
  }

  // جلب تعليقات جديدة من Instagram Graph API
  const handleFetchComments = async () => {
    setCommentsFetching(true)
    setCommentsError(null)
    setFetchResult(null)
    try {
      const res  = await fetch('/api/instagram/comments', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setFetchResult(data.data)
        await loadStoredComments()
        setCommentsOpen(true)
      } else {
        setCommentsError(data.error || 'فشل جلب التعليقات')
        setCommentsOpen(true)
      }
    } catch {
      setCommentsError('خطأ في الاتصال بالخادم')
      setCommentsOpen(true)
    } finally {
      setCommentsFetching(false)
    }
  }

  const privateAccounts = stats?.topAccounts?.filter(a => (a as {isPrivate?: boolean}).isPrivate).length ?? 0

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
            نظرة عامة على حسابات Instagram المراقبة
            {lastSync && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Clock size={10} /> آخر تحديث: {timeAgo(lastSync.toISOString())}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* زر جلب التعليقات */}
          <button
            onClick={handleFetchComments}
            disabled={commentsFetching}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
              bg-ig-purple/10 text-ig-purple border border-ig-purple/20
              hover:bg-ig-purple/20 hover:border-ig-purple/40 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
            title="جلب تعليقات Instagram Graph API"
          >
            {commentsFetching
              ? <Loader2 size={15} className="animate-spin" />
              : <MessageCircle size={15} />
            }
            <span className="hidden sm:inline">
              {commentsFetching ? 'جارٍ الجلب…' : 'جلب التعليقات'}
            </span>
          </button>
          <button
            onClick={fetchStats}
            className="p-2 rounded-xl text-cyber-muted hover:text-ig-purple hover:bg-ig-purple/10 transition-all"
            title="تحديث الإحصائيات"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* الإحصائيات الأربعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="إجمالي الحسابات"
          value={stats?.totalAccounts ?? 0}
          icon={<Users size={18} />}
          color="purple"
          loading={loading}
        />
        <StatsCard
          title="قيد المراقبة"
          value={stats?.trackedAccounts ?? 0}
          icon={<UserCheck size={18} />}
          color="green"
          loading={loading}
        />
        <StatsCard
          title="إجمالي المتابعين"
          value={stats?.totalFollowers ?? 0}
          change={stats?.followerGrowth}
          changeLabel="هذا الأسبوع"
          icon={<TrendingUp size={18} />}
          color="orange"
          loading={loading}
        />
        <StatsCard
          title="إجمالي المنشورات"
          value={stats?.totalPosts ?? 0}
          icon={<FileText size={18} />}
          color="blue"
          loading={loading}
        />
      </div>

      {/* معلومات إضافية سريعة */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="glass rounded-xl border border-cyber-border p-3 flex items-center gap-3">
            <Activity size={16} className="text-ig-purple shrink-0" />
            <div>
              <p className="text-xs text-cyber-muted">نشاطات هذا الأسبوع</p>
              <p className="text-sm font-bold text-white">{stats.recentActivities?.length ?? 0}</p>
            </div>
          </div>
          {privateAccounts > 0 && (
            <div className="glass rounded-xl border border-yellow-500/20 p-3 flex items-center gap-3">
              <Lock size={16} className="text-yellow-400 shrink-0" />
              <div>
                <p className="text-xs text-cyber-muted">حسابات خاصة</p>
                <p className="text-sm font-bold text-yellow-400">{privateAccounts}</p>
              </div>
            </div>
          )}
          <div className="glass rounded-xl border border-cyber-border p-3 flex items-center gap-3">
            <Star size={16} className="text-ig-orange shrink-0" />
            <div>
              <p className="text-xs text-cyber-muted">متوسط المتابعين</p>
              <p className="text-sm font-bold text-white">
                {stats.totalAccounts > 0
                  ? formatNumber(Math.round(stats.totalFollowers / stats.totalAccounts))
                  : '0'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================== قسم التعليقات =================== */}
      <div className="glass rounded-xl border border-cyber-border overflow-hidden">
        {/* رأس القسم - قابل للنقر للطي/التوسيع */}
        <button
          onClick={handleToggleComments}
          className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-ig-purple" />
            <span className="text-sm font-semibold text-white">تعليقات المنشورات</span>
            {comments.length > 0 && (
              <span className="bg-ig-purple/20 text-ig-purple text-xs rounded-full px-2 py-0.5">
                {comments.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {comments.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); loadStoredComments() }}
                className="p-1 rounded-lg text-cyber-muted hover:text-ig-purple transition-colors"
                title="تحديث"
              >
                <RefreshCw size={13} className={commentsLoading ? 'animate-spin' : ''} />
              </button>
            )}
            {commentsOpen ? <ChevronUp size={16} className="text-cyber-muted" /> : <ChevronDown size={16} className="text-cyber-muted" />}
          </div>
        </button>

        {/* المحتوى */}
        {commentsOpen && (
          <div className="border-t border-cyber-border">
            {/* نتيجة الجلب الأخير */}
            {fetchResult && (
              <div className="mx-4 mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 flex items-start gap-2">
                <MessageCircle size={14} className="shrink-0 mt-0.5" />
                <span>
                  ✅ تم جلب <strong>{fetchResult.commentsFetched}</strong> تعليق
                  من <strong>{fetchResult.postsChecked}</strong> منشور
                  للحساب <strong>@{fetchResult.account}</strong>
                  {fetchResult.commentsSaved !== fetchResult.commentsFetched && (
                    <span className="text-green-300"> (محفوظ جديد: {fetchResult.commentsSaved})</span>
                  )}
                </span>
              </div>
            )}

            {/* رسالة الخطأ */}
            {commentsError && (
              <div className="mx-4 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">تعذّر جلب التعليقات</p>
                  <p className="text-xs mt-0.5 text-red-300">{commentsError}</p>
                  {commentsError.includes('INSTAGRAM_ACCESS_TOKEN') && (
                    <p className="text-xs mt-1 text-gray-400">
                      أضف <code className="bg-black/30 px-1 rounded">INSTAGRAM_ACCESS_TOKEN</code> في إعدادات Vercel → Environment Variables
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* حالة التحميل */}
            {commentsLoading && (
              <div className="flex items-center justify-center py-8 text-cyber-muted gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">جارٍ تحميل التعليقات…</span>
              </div>
            )}

            {/* لا توجد تعليقات */}
            {!commentsLoading && !commentsError && comments.length === 0 && (
              <div className="py-10 text-center">
                <MessageCircle size={32} className="mx-auto text-gray-700 mb-3" />
                <p className="text-sm text-cyber-muted">لا توجد تعليقات محفوظة بعد</p>
                <p className="text-xs text-gray-600 mt-1">
                  اضغط <strong className="text-ig-purple">جلب التعليقات</strong> في الأعلى لجلبها من Instagram
                </p>
              </div>
            )}

            {/* قائمة التعليقات */}
            {!commentsLoading && comments.length > 0 && (
              <div className="p-4">
                <div className="space-y-0 max-h-96 overflow-y-auto custom-scrollbar">
                  {comments.map(c => <CommentCard key={c.id} comment={c} />)}
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  عرض {comments.length} تعليق — يتجدد تلقائياً يومياً عبر Cron Job
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* الرسم البياني الحقيقي */}
      <MonitorChart baseFollowers={stats?.totalFollowers ?? 0} />

      {/* النشاطات الأخيرة */}
      <RecentActivity activities={stats?.recentActivities ?? []} />

      {/* أكثر الحسابات متابعة */}
      {(stats?.topAccounts ?? []).length > 0 && (
        <div className="glass rounded-xl p-5 border border-cyber-border">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <UserCheck size={16} className="text-ig-purple" />
            أكثر الحسابات متابعين
          </h3>
          <div className="space-y-3">
            {(stats?.topAccounts ?? []).map((account, idx) => {
              const acc = account as typeof account & { isPrivate?: boolean; isVerified?: boolean; lastStoryTime?: string }
              const proxy = avatarSrc(acc.avatar)
              return (
                <div key={acc.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4 text-center">{idx + 1}</span>
                  {proxy ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={proxy} alt={acc.username} className="w-8 h-8 rounded-full object-cover border border-ig-purple/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full ig-gradient flex items-center justify-center text-white font-bold text-sm">
                      {acc.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-white truncate">@{acc.username}</p>
                      {acc.isPrivate && <Lock size={9} className="text-yellow-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400">
                      {acc.followers.toLocaleString('ar')} متابع
                    </p>
                  </div>
                  <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${Math.min(100, (acc.followers / ((stats?.topAccounts?.[0]?.followers) || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
