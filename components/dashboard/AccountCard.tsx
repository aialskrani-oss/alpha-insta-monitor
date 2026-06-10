'use client'
// بطاقة حساب إنستغرام مع كافة التفاصيل والإجراءات
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Power, ExternalLink, Users, FileText, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatNumber, getStatusText, timeAgo } from '@/lib/utils'
import type { Account } from '@/types'

interface AccountCardProps {
  account: Account
  onDelete: (id: string) => void
  onToggleTracking: (id: string, isTracked: boolean) => void
}

export function AccountCard({ account, onDelete, onToggleTracking }: AccountCardProps) {
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [loadingToggle, setLoadingToggle] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف حساب @${account.username}؟`)) return

    setLoadingDelete(true)
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`تم حذف @${account.username}`)
        onDelete(account.id)
      } else {
        toast.error('فشل حذف الحساب')
      }
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setLoadingDelete(false)
    }
  }

  const handleToggle = async () => {
    setLoadingToggle(true)
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTracked: !account.isTracked }),
      })
      if (res.ok) {
        toast.success(account.isTracked ? `تم إيقاف مراقبة @${account.username}` : `تم تشغيل مراقبة @${account.username}`)
        onToggleTracking(account.id, !account.isTracked)
      } else {
        toast.error('فشل تغيير الحالة')
      }
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setLoadingToggle(false)
    }
  }

  const statusVariant = {
    ACTIVE: 'success' as const,
    INACTIVE: 'default' as const,
    ERROR: 'danger' as const,
    PENDING: 'warning' as const,
  }

  return (
    <div className="glass rounded-xl border border-cyber-border hover:border-ig-purple/30 transition-all duration-200 overflow-hidden group">
      {/* شريط ملون أعلى البطاقة */}
      <div className={`h-1 ${account.isTracked ? 'ig-gradient' : 'bg-cyber-border'}`} />

      <div className="p-5">
        {/* رأس البطاقة */}
        <div className="flex items-start gap-3 mb-4">
          {/* الصورة الشخصية */}
          <div className="relative shrink-0">
            {account.avatar ? (
              <Image
                src={account.avatar}
                alt={account.username}
                width={48}
                height={48}
                className="rounded-full object-cover border-2 border-ig-purple/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-full ig-gradient flex items-center justify-center text-white font-bold text-lg">
                {account.username[0]?.toUpperCase()}
              </div>
            )}
            {account.isTracked && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-cyber-bg" />
            )}
          </div>

          {/* معلومات الحساب */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-cyber-text truncate">
                {account.fullName || account.username}
              </p>
              <Badge variant={statusVariant[account.status]} size="sm" dot>
                {getStatusText(account.status)}
              </Badge>
            </div>
            <a
              href={`https://instagram.com/${account.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-ig-purple hover:text-ig-pink transition-colors mt-0.5"
            >
              <span>@{account.username}</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'متابعون', value: account.followers, icon: <Users size={12} /> },
            { label: 'يتابع', value: account.following, icon: <UserCheck size={12} /> },
            { label: 'منشورات', value: account.posts, icon: <FileText size={12} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-cyber-card rounded-lg p-2 text-center border border-cyber-border">
              <div className="flex items-center justify-center gap-1 text-cyber-muted mb-1">
                {stat.icon}
              </div>
              <p className="text-sm font-bold text-cyber-text">{formatNumber(stat.value)}</p>
              <p className="text-[10px] text-cyber-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* آخر فحص */}
        {account.lastChecked && (
          <p className="text-xs text-cyber-muted mb-4">
            آخر فحص: {timeAgo(account.lastChecked)}
          </p>
        )}

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-2">
          <Button
            variant={account.isTracked ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggle}
            loading={loadingToggle}
            icon={<Power size={14} />}
            className="flex-1 text-xs"
          >
            {account.isTracked ? 'إيقاف' : 'تشغيل'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={loadingDelete}
            icon={<Trash2 size={14} />}
          >
            حذف
          </Button>
        </div>
      </div>
    </div>
  )
}
