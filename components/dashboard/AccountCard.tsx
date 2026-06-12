'use client'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Power, ExternalLink, Users, FileText, UserCheck, RefreshCw, Edit2, Check, X, Clock, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatNumber, getStatusText, timeAgo } from '@/lib/utils'
import type { Account } from '@/types'

interface AccountCardProps {
  account: Account
  onDelete: (id: string) => void
  onToggleTracking: (id: string, isTracked: boolean) => void
  onUpdate?: (id: string, data: Partial<Account>) => void
}

function getLastSeen(account: Account): string | null {
  const times = [account.lastPostTime, account.lastStoryTime, account.lastChecked].filter(Boolean) as string[]
  if (!times.length) return null
  return times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
}

export function AccountCard({ account, onDelete, onToggleTracking, onUpdate }: AccountCardProps) {
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [loadingSync, setLoadingSync] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [manualFollowers, setManualFollowers] = useState(String(account.followers))
  const [manualFollowing, setManualFollowing] = useState(String(account.following))
  const [manualPosts, setManualPosts] = useState(String(account.posts))

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف حساب @${account.username}؟`)) return
    setLoadingDelete(true)
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`تم حذف @${account.username}`)
        onDelete(account.id)
      } else toast.error('فشل حذف الحساب')
    } catch { toast.error('حدث خطأ') }
    finally { setLoadingDelete(false) }
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
        toast.success(account.isTracked ? `إيقاف @${account.username}` : `تشغيل @${account.username}`)
        onToggleTracking(account.id, !account.isTracked)
      } else toast.error('فشل تغيير الحالة')
    } catch { toast.error('حدث خطأ') }
    finally { setLoadingToggle(false) }
  }

  const handleSync = async () => {
    setLoadingSync(true)
    try {
      const res = await fetch(`/api/accounts/${account.id}/sync`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || '✅ تم التحديث من Instagram')
        onUpdate?.(account.id, data.data)
        setManualFollowers(String(data.data?.followers ?? account.followers))
        setManualFollowing(String(data.data?.following ?? account.following))
        setManualPosts(String(data.data?.posts ?? account.posts))
      } else if (data.partial) {
        toast.warning('Instagram محجوب من الخادم — استخدم التحديث اليدوي 👇')
        setEditMode(true)
      } else {
        toast.error(data.error || 'فشل المزامنة')
      }
    } catch { toast.error('خطأ في الاتصال') }
    finally { setLoadingSync(false) }
  }

  const handleManualSave = async () => {
    const followers = parseInt(manualFollowers) || 0
    const following = parseInt(manualFollowing) || 0
    const posts = parseInt(manualPosts) || 0
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followers, following, posts }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('✅ تم حفظ البيانات')
        onUpdate?.(account.id, { followers, following, posts })
        setEditMode(false)
      } else toast.error('فشل الحفظ')
    } catch { toast.error('خطأ في الاتصال') }
  }

  const statusVariant: Record<string, 'success' | 'default' | 'danger' | 'warning'> = {
    ACTIVE: 'success',
    INACTIVE: 'default',
    ERROR: 'danger',
    PENDING: 'warning',
  }

  const showAvatar = account.avatar && !imgError
  const lastSeen = getLastSeen(account)

  return (
    <div className="glass rounded-xl border border-cyber-border hover:border-ig-purple/30 transition-all duration-200 overflow-hidden group">
      {/* شريط ملون أعلى */}
      <div className={`h-1 ${account.isTracked ? 'ig-gradient' : 'bg-cyber-border'}`} />

      <div className="p-5">
        {/* رأس البطاقة */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            {showAvatar ? (
              <Image
                src={account.avatar!}
                alt={account.username}
                width={48}
                height={48}
                className="rounded-full object-cover border-2 border-ig-purple/30"
                onError={() => setImgError(true)}
                unoptimized
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-cyber-text truncate">
                {account.fullName || account.username}
              </p>
              <Badge variant={statusVariant[account.status] || 'default'} size="sm" dot>
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

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                setEditMode(!editMode)
                setManualFollowers(String(account.followers))
                setManualFollowing(String(account.following))
                setManualPosts(String(account.posts))
              }}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-ig-purple hover:bg-ig-purple/10 transition-all"
              title="تحديث يدوي"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={handleSync}
              disabled={loadingSync}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-ig-purple hover:bg-ig-purple/10 transition-all disabled:opacity-40"
              title="مزامنة من Instagram"
            >
              <RefreshCw size={13} className={loadingSync ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* السيرة الذاتية */}
        {account.bio && !editMode && (
          <p className="text-[11px] text-cyber-muted mb-3 line-clamp-2 leading-relaxed">{account.bio}</p>
        )}

        {/* الإحصائيات */}
        {editMode ? (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] text-ig-purple font-medium">✏️ أدخل القيم يدوياً:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'متابعون', value: manualFollowers, set: setManualFollowers },
                { label: 'يتابع', value: manualFollowing, set: setManualFollowing },
                { label: 'منشورات', value: manualPosts, set: setManualPosts },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-[10px] text-cyber-muted">{label}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="w-full bg-cyber-bg border border-ig-purple/30 rounded-lg px-2 py-1.5 text-xs text-cyber-text focus:outline-none focus:border-ig-purple text-center"
                    min="0"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleManualSave}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-ig-purple/20 text-ig-purple text-xs hover:bg-ig-purple/30 transition-all">
                <Check size={12} /> حفظ
              </button>
              <button onClick={() => setEditMode(false)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cyber-border text-cyber-muted text-xs hover:bg-cyber-card transition-all">
                <X size={12} /> إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'متابعون', value: account.followers, icon: <Users size={12} /> },
              { label: 'يتابع', value: account.following, icon: <UserCheck size={12} /> },
              { label: 'منشورات', value: account.posts, icon: <FileText size={12} /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-cyber-card rounded-lg p-2 text-center border border-cyber-border">
                <div className="flex items-center justify-center gap-1 text-cyber-muted mb-1">{stat.icon}</div>
                <p className="text-sm font-bold text-cyber-text">{formatNumber(stat.value)}</p>
                <p className="text-[10px] text-cyber-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* آخر نشاط - آخر ظهور */}
        {!editMode && (
          <div className="space-y-0.5 mb-4">
            {lastSeen && (
              <p className="text-[11px] text-cyber-muted flex items-center gap-1">
                <Activity size={10} className="text-ig-purple shrink-0" />
                <span>آخر نشاط: {timeAgo(lastSeen)}</span>
              </p>
            )}
            {account.lastPostTime && (
              <p className="text-[11px] text-cyber-muted flex items-center gap-1">
                <FileText size={10} className="text-ig-pink shrink-0" />
                <span>آخر منشور: {timeAgo(account.lastPostTime)}</span>
              </p>
            )}
            {account.lastStoryTime && (
              <p className="text-[11px] text-cyber-muted flex items-center gap-1">
                <Clock size={10} className="text-ig-orange shrink-0" />
                <span>آخر ستوري: {timeAgo(account.lastStoryTime)}</span>
              </p>
            )}
            {!lastSeen && account.lastChecked && (
              <p className="text-[11px] text-cyber-muted flex items-center gap-1">
                <RefreshCw size={10} className="shrink-0" />
                <span>آخر تحديث: {timeAgo(account.lastChecked)}</span>
              </p>
            )}
          </div>
        )}

        {/* أزرار الإجراءات */}
        {!editMode && (
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
        )}
      </div>
    </div>
  )
}
