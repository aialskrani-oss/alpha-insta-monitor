'use client'
// لوحة التحكم الرئيسية
import { useEffect, useState } from 'react'
import { Users, UserCheck, TrendingUp, FileText, Eye } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { MonitorChart } from '@/components/dashboard/MonitorChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import type { DashboardStats } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch {
      // تجاهل الأخطاء الصامتة
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* عنوان الصفحة */}
      <div>
        <h1 className="text-2xl font-bold text-cyber-text">
          لوحة التحكم
        </h1>
        <p className="text-sm text-cyber-muted mt-1">
          نظرة عامة على حسابات إنستغرام المراقبة
        </p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="إجمالي الحسابات"
          value={stats?.totalAccounts ?? 0}
          change={0}
          icon={<Users size={18} />}
          color="purple"
          loading={loading}
        />
        <StatsCard
          title="حسابات نشطة"
          value={stats?.trackedAccounts ?? 0}
          icon={<Eye size={18} />}
          color="pink"
          loading={loading}
        />
        <StatsCard
          title="إجمالي المتابعين"
          value={stats?.totalFollowers ?? 0}
          change={stats?.followerGrowth}
          changeLabel="مقارنة الأسبوع الماضي"
          icon={<TrendingUp size={18} />}
          color="orange"
          loading={loading}
        />
        <StatsCard
          title="إجمالي المنشورات"
          value={stats?.totalPosts ?? 0}
          icon={<FileText size={18} />}
          color="green"
          loading={loading}
        />
      </div>

      {/* الرسم البياني والنشاطات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <MonitorChart baseFollowers={stats?.totalFollowers || 15000} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity
            activities={stats?.recentActivities ?? []}
            loading={loading}
          />
        </div>
      </div>

      {/* أكثر الحسابات متابعة */}
      {stats?.topAccounts && (stats.topAccounts?.length ?? 0) > 0 && (
        <div className="glass rounded-xl p-5 border border-cyber-border">
          <h3 className="text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
            <UserCheck size={16} className="text-ig-purple" />
            أكثر الحسابات متابعين
          </h3>
          <div className="space-y-3">
            {stats.topAccounts.map((account, idx) => (
              <div key={account.id} className="flex items-center gap-3">
                <span className="text-xs text-cyber-muted w-5 text-center font-bold">
                  {idx + 1}
                </span>
                <div className="w-8 h-8 rounded-full ig-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {account.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-cyber-text truncate">
                    @{account.username}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1 rounded-full bg-cyber-border overflow-hidden">
                      <div
                        className="h-full ig-gradient rounded-full"
                        style={{
                          width: `${Math.min(100, (account.followers / ((stats.topAccounts ?? [])[0]?.followers || 1)) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-cyber-muted shrink-0">
                      {(account.followers / 1000).toFixed(1)}K
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
