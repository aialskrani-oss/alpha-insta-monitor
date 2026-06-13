'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Users, UserCheck, TrendingUp, TrendingDown, FileText,
  RefreshCw, Activity, Lock, Clock, Star,
  MessageCircle, ChevronDown, ChevronUp, AlertCircle,
  Loader2, History, BarChart2, ArrowUpRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area,
} from 'recharts'
import { StatsCard }    from '@/components/dashboard/StatsCard'
import { MonitorChart } from '@/components/dashboard/MonitorChart'
import RecentActivity   from '@/components/dashboard/RecentActivity'
import { formatNumber, timeAgo } from '@/lib/utils'
import type { DashboardStats, Comment, FollowerChange, TopAccount } from '@/types'

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
          <span className="text-xs font-semibold text-ig-purple">@{comment.mediaOwner || comment.account?.username}</span>
          <span className="text-[10px] text-gray-600">{timeAgo(comment.timestamp)}</span>
        </div>
        <p className="text-sm text-cyber-text leading-relaxed break-words">{comment.text}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats,    setStats]    = useState<DashboardStats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const [comments,         setComments]         = useState<Comment[]>([])
  const [commentsOpen,     setCommentsOpen]     = useState(false)
  const [commentsFetching, setCommentsFetching] = useState(false)
  const [commentsLoading,  setCommentsLoading]  = useState(false)
  const [commentsError,    setCommentsError]    = useState<string | null>(null)
  const [fetchResult,      setFetchResult]      = useState<{ postsChecked: number; commentsFetched: number; commentsSaved: number; account: string } | null>(null)

  const [followerChanges, setFollowerChanges] = useState<FollowerChange[]>([])
  const [changesOpen,     setChangesOpen]     = useState(false)
  const [changesLoading,  setChangesLoading]  = useState(false)
  const [scanningChanges, setScanningChanges] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) { setStats(data.data); setLastSync(new Date()) }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const loadStoredComments = useCallback(async () => {
    setCommentsLoading(true); setCommentsError(null)
    try {
      const res  = await fetch('/api/instagram/comments?limit=50')
      const data = await res.json()
      if (data.success) setComments(data.data)
      else setCommentsError(data.error || 'تعذّر جلب التعليقات')
    } catch { setCommentsError('خطأ في الاتصال') }
    finally { setCommentsLoading(false) }
  }, [])

  const loadFollowerChanges = useCallback(async () => {
    setChangesLoading(true)
    try {
      const res  = await fetch('/api/instagram/account-changes?limit=30')
      const data = await res.json()
      if (data.success) setFollowerChanges(data.data)
    } finally { setChangesLoading(false) }
  }, [])

  const handleToggleComments = () => {
    if (!commentsOpen && comments.length === 0) loadStoredComments()
    setCommentsOpen(p => !p)
  }
  const handleToggleChanges = () => {
    if (!changesOpen && followerChanges.length === 0) loadFollowerChanges()
    setChangesOpen(p => !p)
  }

  const handleFetchComments = async () => {
    setCommentsFetching(true); setCommentsError(null); setFetchResult(null)
    try {
      const res  = await fetch('/api/instagram/comments', { method: 'POST' })
      const data = await res.json()
      if (data.success) { setFetchResult(data.data); await loadStoredComments(); setCommentsOpen(true) }
      else { setCommentsError(data.error || 'فشل جلب التعليقات'); setCommentsOpen(true) }
    } catch { setCommentsError('خطأ في الاتصال') }
    finally { setCommentsFetching(false) }
  }

  const handleScanChanges = async () => {
    setScanningChanges(true)
    try {
      await fetch('/api/instagram/account-changes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      await loadFollowerChanges(); setChangesOpen(true)
    } finally { setScanningChanges(false) }
  }

  const changesChart = [...followerChanges].reverse().slice(-15).map(c => ({
    date: new Date(c.recordedAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
    تغيير: c.change,
    إجمالي: c.newCount,
  }))

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
            نظرة عامة على حسابات Instagram المراقبة
            {lastSync && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Clock size={10} /> {timeAgo(lastSync.toISOString())}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleFetchComments} disabled={commentsFetching}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-ig-purple/10 text-ig-purple border border-ig-purple/20 hover:bg-ig-purple/20 transition-all disabled:opacity-50">
            {commentsFetching ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
            <span className="hidden sm:inline">{commentsFetching ? 'جارٍ الجلب…' : 'جلب التعليقات'}</span>
          </button>
          <button onClick={handleScanChanges} disabled={scanningChanges}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50">
            {scanningChanges ? <Loader2 size={15} className="animate-spin" /> : <History size={15} />}
            <span className="hidden sm:inline">{scanningChanges ? 'جارٍ الفحص…' : 'فحص التغييرات'}</span>
          </button>
          <button onClick={fetchStats}
            className="p-2 rounded-xl text-cyber-muted hover:text-ig-purple hover:bg-ig-purple/10 transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="إجمالي الحسابات"  value={stats?.totalAccounts ?? 0}  icon={<Users size={18} />}     color="purple"  loading={loading} />
        <StatsCard title="قيد المراقبة"      value={stats?.trackedAccounts ?? 0} icon={<UserCheck size={18} />} color="green"   loading={loading} />
        <StatsCard title="إجمالي المتابعين"  value={stats?.totalFollowers ?? 0}  change={stats?.followerGrowth} changeLabel="هذا الأسبوع" icon={<TrendingUp size={18} />} color="orange" loading={loading} />
        <StatsCard title="إجمالي المنشورات" value={stats?.totalPosts ?? 0}       icon={<FileText size={18} />}  color="blue"    loading={loading} />
      </div>

      {/* معلومات سريعة */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="glass rounded-xl border border-cyber-border p-3 flex items-center gap-3">
            <Activity size={16} className="text-ig-purple shrink-0" />
            <div><p className="text-xs text-cyber-muted">نشاطات هذا الأسبوع</p><p className="text-sm font-bold text-white">{stats.recentActivities?.length ?? 0}</p></div>
          </div>
          {(stats.topAccounts ?? []).some(a => a.isPrivate) && (
            <div className="glass rounded-xl border border-yellow-500/20 p-3 flex items-center gap-3">
              <Lock size={16} className="text-yellow-400 shrink-0" />
              <div><p className="text-xs text-cyber-muted">حسابات خاصة</p><p className="text-sm font-bold text-yellow-400">{(stats.topAccounts ?? []).filter(a => a.isPrivate).length}</p></div>
            </div>
          )}
          <div className="glass rounded-xl border border-cyber-border p-3 flex items-center gap-3">
            <Star size={16} className="text-ig-orange shrink-0" />
            <div><p className="text-xs text-cyber-muted">متوسط المتابعين</p>
              <p className="text-sm font-bold text-white">
                {stats.totalAccounts > 0 ? formatNumber(Math.round(stats.totalFollowers / stats.totalAccounts)) : '0'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ تغييرات المتابعين ═══════════════════════════════════ */}
      <div className="glass rounded-xl border border-cyber-border overflow-hidden">
        <button onClick={handleToggleChanges} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">تغييرات المتابعين</span>
            {followerChanges.length > 0 && <span className="bg-blue-500/20 text-blue-400 text-xs rounded-full px-2 py-0.5">{followerChanges.length}</span>}
          </div>
          <div className="flex items-center gap-2">
            {followerChanges.length > 0 && (
              <button onClick={e => { e.stopPropagation(); loadFollowerChanges() }}
                className="p-1 rounded-lg text-cyber-muted hover:text-blue-400 transition-colors">
                <RefreshCw size={13} className={changesLoading ? 'animate-spin' : ''} />
              </button>
            )}
            {changesOpen ? <ChevronUp size={16} className="text-cyber-muted" /> : <ChevronDown size={16} className="text-cyber-muted" />}
          </div>
        </button>

        {changesOpen && (
          <div className="border-t border-cyber-border p-4 space-y-4">
            {changesChart.length > 1 && (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={changesChart} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid #2d2d4e', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="تغيير" radius={[4, 4, 0, 0]}>
                    {changesChart.map((c, i) => <Cell key={i} fill={(c['تغيير'] as number) >= 0 ? '#22c55e' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {changesLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-cyber-muted"><Loader2 size={15} className="animate-spin" /><span className="text-sm">جارٍ التحميل…</span></div>
            ) : followerChanges.length === 0 ? (
              <div className="py-8 text-center">
                <BarChart2 size={28} className="mx-auto text-gray-700 mb-2" />
                <p className="text-sm text-cyber-muted">لا توجد تغييرات مسجّلة</p>
                <p className="text-xs text-gray-600 mt-1">اضغط <strong className="text-blue-400">فحص التغييرات</strong> في الأعلى</p>
              </div>
            ) : (
              <div className="divide-y divide-cyber-border">
                {followerChanges.slice(0, 10).map(c => (
                  <div key={c.id} className="flex items-center gap-3 py-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${c.change > 0 ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                      {c.change > 0 ? <TrendingUp size={13} className="text-green-400" /> : <TrendingDown size={13} className="text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">@{c.account?.username}</span>
                        <span className={`text-xs font-bold ${c.change > 0 ? 'text-green-400' : 'text-red-400'}`}>{c.change > 0 ? '+' : ''}{c.change.toLocaleString('ar')}</span>
                        <span className="text-[10px] text-cyber-muted">→ {c.newCount.toLocaleString('ar')}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">{timeAgo(c.recordedAt)}</span>
                  </div>
                ))}
                {followerChanges.length > 10 && <p className="text-xs text-center text-cyber-muted pt-2">+ {followerChanges.length - 10} تغيير آخر</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ تعليقات المنشورات ════════════════════════════════════ */}
      <div className="glass rounded-xl border border-cyber-border overflow-hidden">
        <button onClick={handleToggleComments} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-ig-purple" />
            <span className="text-sm font-semibold text-white">تعليقات المنشورات</span>
            {comments.length > 0 && <span className="bg-ig-purple/20 text-ig-purple text-xs rounded-full px-2 py-0.5">{comments.length}</span>}
          </div>
          <div className="flex items-center gap-2">
            {comments.length > 0 && (
              <button onClick={e => { e.stopPropagation(); loadStoredComments() }}
                className="p-1 rounded-lg text-cyber-muted hover:text-ig-purple transition-colors">
                <RefreshCw size={13} className={commentsLoading ? 'animate-spin' : ''} />
              </button>
            )}
            {commentsOpen ? <ChevronUp size={16} className="text-cyber-muted" /> : <ChevronDown size={16} className="text-cyber-muted" />}
          </div>
        </button>

        {commentsOpen && (
          <div className="border-t border-cyber-border">
            {fetchResult && (
              <div className="mx-4 mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 flex items-start gap-2">
                <MessageCircle size={14} className="shrink-0 mt-0.5" />
                <span>✅ تم جلب <strong>{fetchResult.commentsFetched}</strong> تعليق من <strong>{fetchResult.postsChecked}</strong> منشور للحساب <strong>@{fetchResult.account}</strong></span>
              </div>
            )}
            {commentsError && (
              <div className="mx-4 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">تعذّر جلب التعليقات</p>
                  <p className="text-xs mt-0.5 text-red-300">{commentsError}</p>
                  {commentsError.includes('INSTAGRAM_ACCESS_TOKEN') && (
                    <p className="text-xs mt-1 text-gray-400">أضف <code className="bg-black/30 px-1 rounded">INSTAGRAM_ACCESS_TOKEN</code> في إعدادات Vercel</p>
                  )}
                </div>
              </div>
            )}
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-cyber-muted"><Loader2 size={16} className="animate-spin" /><span className="text-sm">جارٍ التحميل…</span></div>
            ) : comments.length === 0 ? (
              <div className="py-10 text-center">
                <MessageCircle size={32} className="mx-auto text-gray-700 mb-3" />
                <p className="text-sm text-cyber-muted">لا توجد تعليقات محفوظة بعد</p>
                <p className="text-xs text-gray-600 mt-1">اضغط <strong className="text-ig-purple">جلب التعليقات</strong> في الأعلى</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="max-h-80 overflow-y-auto">
                  {comments.map(c => <CommentCard key={c.id} comment={c} />)}
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">عرض {comments.length} تعليق — يتجدد تلقائياً عبر Cron Job</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* الرسم البياني */}
      <MonitorChart baseFollowers={stats?.totalFollowers ?? 0} />

      {/* النشاطات الأخيرة */}
      <RecentActivity activities={stats?.recentActivities ?? []} />

      {/* أكثر الحسابات متابعة */}
      {(stats?.topAccounts ?? []).length > 0 && (
        <div className="glass rounded-xl p-5 border border-cyber-border">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <UserCheck size={16} className="text-ig-purple" /> أكثر الحسابات متابعين
          </h3>
          <div className="space-y-3">
            {(stats?.topAccounts ?? []).map((acc: TopAccount, idx) => {
              const proxy = avatarSrc(acc.avatar)
              return (
                <a key={acc.id} href={`/dashboard/accounts/${acc.id}`}
                  className="flex items-center gap-3 hover:bg-white/[0.02] rounded-lg p-1 -mx-1 transition-colors group">
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
                    <p className="text-xs text-gray-400">{acc.followers.toLocaleString('ar')} متابع</p>
                  </div>
                  <ArrowUpRight size={13} className="text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${Math.min(100, (acc.followers / ((stats?.topAccounts?.[0]?.followers) || 1)) * 100)}%` }} />
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
