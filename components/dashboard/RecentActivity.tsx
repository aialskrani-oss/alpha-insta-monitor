'use client'
  // مكوّن آخر النشاطات والأحداث
  import React from 'react'
  import { Activity as ActivityIcon, TrendingUp, TrendingDown, FileText, User, AlertCircle, Play } from 'lucide-react'
  import { Activity } from '@/types'

  interface RecentActivityProps {
    activities: Activity[]
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'الآن'
    if (mins < 60) return `منذ ${mins} دقيقة`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `منذ ${hours} ساعة`
    const days = Math.floor(hours / 24)
    return `منذ ${days} يوم`
  }

  const activityConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    FOLLOWER_GAIN: { icon: <TrendingUp size={14} />, color: 'text-green-400 bg-green-400/10' },
    FOLLOWER_LOSS: { icon: <TrendingDown size={14} />, color: 'text-red-400 bg-red-400/10' },
    NEW_POST: { icon: <FileText size={14} />, color: 'text-blue-400 bg-blue-400/10' },
    NEW_STORY: { icon: <Play size={14} />, color: 'text-purple-400 bg-purple-400/10' },
    PROFILE_CHANGE: { icon: <User size={14} />, color: 'text-yellow-400 bg-yellow-400/10' },
    STATUS_CHANGE: { icon: <ActivityIcon size={14} />, color: 'text-purple-400 bg-purple-400/10' },
    ERROR: { icon: <AlertCircle size={14} />, color: 'text-red-400 bg-red-400/10' },
  }

  export default function RecentActivity({ activities }: RecentActivityProps) {
    if (activities.length === 0) {
      return (
        <div className="glass rounded-xl border border-cyber-border p-5">
          <h3 className="text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
            <ActivityIcon size={16} className="text-ig-purple" />
            آخر النشاطات
          </h3>
          <div className="text-center py-8 text-cyber-muted text-sm">
            <ActivityIcon size={32} className="mx-auto mb-2 opacity-30" />
            <p>لا توجد نشاطات بعد</p>
            <p className="text-xs mt-1 opacity-70">ستظهر هنا عند بدء المراقبة</p>
          </div>
        </div>
      )
    }

    return (
      <div className="glass rounded-xl border border-cyber-border p-5">
        <h3 className="text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
          <ActivityIcon size={16} className="text-ig-purple" />
          آخر النشاطات
          <span className="mr-auto text-xs text-cyber-muted font-normal">{activities.length} حدث</span>
        </h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((activity) => {
            const config = activityConfig[activity.type] || activityConfig.STATUS_CHANGE
            return (
              <div key={activity.id} className="flex items-start gap-3 group">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {activity.account && (
                        <span className="text-xs font-medium text-ig-purple">@{activity.account.username} </span>
                      )}
                      <span className="text-xs text-cyber-text">{activity.message}</span>
                    </div>
                    <span className="text-xs text-cyber-muted whitespace-nowrap shrink-0">
                      {timeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }