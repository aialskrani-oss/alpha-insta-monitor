// مكوّن آخر النشاطات والأحداث
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Activity as ActivityIcon, TrendingUp, TrendingDown, FileText, User, AlertCircle } from 'lucide-react'
import { timeAgo, getActivityText } from '@/lib/utils'
import type { Activity } from '@/types'

const activityConfig = {
  FOLLOWER_GAIN: {
    icon: <TrendingUp size={14} />,
    variant: 'success' as const,
  },
  FOLLOWER_LOSS: {
    icon: <TrendingDown size={14} />,
    variant: 'danger' as const,
  },
  NEW_POST: {
    icon: <FileText size={14} />,
    variant: 'info' as const,
  },
  PROFILE_CHANGE: {
    icon: <User size={14} />,
    variant: 'warning' as const,
  },
  STATUS_CHANGE: {
    icon: <ActivityIcon size={14} />,
    variant: 'purple' as const,
  },
  ERROR: {
    icon: <AlertCircle size={14} />,
    variant: 'danger' as const,
  },
}

interface RecentActivityProps {
  activities: Activity[]
  loading?: boolean
}

export function RecentActivity({ activities, loading = false }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader
        title="آخر النشاطات"
        icon={<ActivityIcon size={16} />}
        subtitle={`${activities.length} حدث`}
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-cyber-border shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-cyber-border rounded w-3/4" />
                <div className="h-3 bg-cyber-border rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <ActivityIcon size={32} className="text-cyber-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm text-cyber-muted">لا توجد نشاطات بعد</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((activity) => {
            const config = activityConfig[activity.type] || activityConfig.STATUS_CHANGE
            return (
              <div key={activity.id} className="flex items-start gap-3 group">
                {/* أيقونة النوع */}
                <div className="mt-0.5 shrink-0">
                  <Badge variant={config.variant} size="sm">
                    {config.icon}
                  </Badge>
                </div>

                {/* المحتوى */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-cyber-text leading-relaxed line-clamp-2">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.account?.username && (
                      <span className="text-[10px] text-ig-purple font-medium">
                        @{activity.account.username}
                      </span>
                    )}
                    <span className="text-[10px] text-cyber-muted">
                      {timeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
