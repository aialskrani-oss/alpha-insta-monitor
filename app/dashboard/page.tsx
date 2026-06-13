'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Users, UserCheck, TrendingUp, FileText,
  RefreshCw, Activity, Lock, Clock, Star,
} from 'lucide-react'
import { StatsCard }     from '@/components/dashboard/StatsCard'
import { MonitorChart }  from '@/components/dashboard/MonitorChart'
import RecentActivity    from '@/components/dashboard/RecentActivity'
import { formatNumber, timeAgo } from '@/lib/utils'
import type { DashboardStats } from '@/types'

function avatarSrc(url?: string | null) {
  if (!url) return null
  return `/api/proxy/image?url=${encodeURIComponent(url)}`
}

export default function DashboardPage() {
  const [stats,    setStats]    = useState<DashboardStats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

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
    // تحديث تلقائي كل 5 دقائق لو اللوحة مفتوحة
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // حساب عدد الحسابات الخاصة
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
        <button onClick={fetchStats}
          className="p-2 rounded-xl text-cyber-muted hover:text-ig-purple hover:bg-ig-purple/10 transition-all" title="تحديث الإحصائيات">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
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
