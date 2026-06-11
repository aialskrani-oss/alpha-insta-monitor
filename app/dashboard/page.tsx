'use client'
  // لوحة التحكم الرئيسية
  import { useEffect, useState } from 'react'
  import { Users, UserCheck, TrendingUp, FileText } from 'lucide-react'
  import { StatsCard } from '@/components/dashboard/StatsCard'
  import { MonitorChart } from '@/components/dashboard/MonitorChart'
  import RecentActivity from '@/components/dashboard/RecentActivity'
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
        console.error('Failed to fetch stats')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
          <p className="text-sm text-gray-400 mt-0.5">نظرة عامة على حسابات Instagram المراقبة</p>
        </div>

        {/* الإحصائيات */}
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

        {/* الرسم البياني */}
        <MonitorChart baseFollowers={stats?.totalFollowers ?? 15000} />

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
              {(stats?.topAccounts ?? []).map((account, idx) => (
                <div key={account.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4">{idx + 1}</span>
                  {account.avatar && (
                    <img src={account.avatar} alt={account.username} className="w-8 h-8 rounded-full object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">@{account.username}</p>
                    <p className="text-xs text-gray-400">{account.followers.toLocaleString('ar')} متابع</p>
                  </div>
                  <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${Math.min(100, (account.followers / ((stats?.topAccounts?.[0]?.followers) || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }