'use client'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Trash2, Power, ExternalLink, Users, FileText, UserCheck,
  RefreshCw, Edit2, Check, X, Clock, Activity, Bell, BellOff,
  Image as ImageIcon, ChevronDown, ChevronUp,
} from 'lucide-react'
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

// حساب "آخر ظهور" من أحدث الأوقات المتاحة
function getLastSeen(account: Account): { time: string | null; source: string } {
  const candidates: { time: string; label: string; priority: number }[] = []
  if (account.lastStoryTime)    candidates.push({ time: account.lastStoryTime, label: 'آخر ستوري', priority: 3 })
  if (account.lastPostTime)     candidates.push({ time: account.lastPostTime, label: 'آخر منشور', priority: 2 })
  if (account.lastActivityTime) candidates.push({ time: account.lastActivityTime, label: 'آخر نشاط', priority: 1 })
  if (account.lastChecked)      candidates.push({ time: account.lastChecked, label: 'آخر فحص', priority: 0 })
  if (!candidates.length) return { time: null, source: '' }
  candidates.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  return { time: candidates[0].time, source: candidates[0].label }
}

// مدى قِدَم آخر ظهور للتلوين
function getActivityBadge(time: string | null): { label: string; color: string } | null {
  if (!time) return null
  const diff = Date.now() - new Date(time).getTime()
  const hours = diff / 3600000
  if (hours < 1)  return { label: 'نشط الآن تقريباً', color: 'text-green-400 bg-green-500/10 border-green-500/30' }
  if (hours < 6)  return { label: 'نشط منذ ساعات', color: 'text-green-300 bg-green-500/8 border-green-500/20' }
  if (hours < 24) return { label: 'نشط اليوم', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' }
  if (hours < 72) return { label: 'نشط هذا الأسبوع', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' }
  return { label: 'غير نشط مؤخراً', color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' }
}

// زر toggle مخصص للإشعارات
function NotifyToggle({
  label, emoji, value, onChange,
}: { label: string; emoji: string; value: boolean | null | undefined; onChange: (v: boolean | null) => void }) {
  const state = value === null || value === undefined ? null : value
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/30 last:border-0">
      <span className="text-xs text-cyber-muted flex items-center gap-1.5">
        <span>{emoji}</span> {label}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(null)}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${state === null ? 'bg-ig-purple/20 text-ig-purple border border-ig-purple/30' : 'text-cyber-muted hover:text-cyber-text'}`}
          title="اتبع الإعداد العام">عام</button>
        <button onClick={() => onChange(true)}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${state === true ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-cyber-muted hover:text-green-400'}`}
          title="تفعيل دائماً">✓</button>
        <button onClick={() => onChange(false)}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${state === false ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-cyber-muted hover:text-red-400'}`}
          title="إيقاف دائماً">✗</button>
      </div>
    </div>
  )
}

export function AccountCard({ account, onDelete, onToggleTracking, onUpdate }: AccountCardProps) {
  const [loadingDelete, setLoadingDelete]   = useState(false)
  const [loadingToggle, setLoadingToggle]   = useState(false)
  const [loadingSync, setLoadingSync]       = useState(false)
  const [savingNotify, setSavingNotify]     = useState(false)
  const [imgError, setImgError]             = useState(false)
  const [editMode, setEditMode]             = useState(false)
  const [showNotify, setShowNotify]         = useState(false)
  const [manualFollowers, setManualFollowers] = useState(String(account.followers))
  const [manualFollowing, setManualFollowing] = useState(String(account.following))
  const [manualPosts, setManualPosts]         = useState(String(account.posts))

  // إعدادات الإشعارات المحلية
  const [localNotify, setLocalNotify] = useState<{
    notifyOnFollow: boolean | null
    notifyOnUnfollow: boolean | null
    notifyOnNewPost: boolean | null
    notifyOnNewStory: boolean | null
    notifyOnBioChange: boolean | null
  }>({
    notifyOnFollow:    account.notifyOnFollow    ?? null,
    notifyOnUnfollow:  account.notifyOnUnfollow  ?? null,
    notifyOnNewPost:   account.notifyOnNewPost   ?? null,
    notifyOnNewStory:  account.notifyOnNewStory  ?? null,
    notifyOnBioChange: account.notifyOnBioChange ?? null,
  })

  const handleSaveNotify = async () => {
    setSavingNotify(true)
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localNotify),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('✅ تم حفظ إعدادات الإشعارات')
        onUpdate?.(account.id, localNotify)
        setShowNotify(false)
      } else toast.error('فشل الحفظ')
    } catch { toast.error('خطأ في الاتصال') }
    finally { setSavingNotify(false) }
  }

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
    const posts     = parseInt(manualPosts) || 0
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
    ACTIVE: 'success', INACTIVE: 'default', ERROR: 'danger', PENDING: 'warning',
  }

  const showAvatar = account.avatar && !imgError
  const { time: lastSeenTime, source: lastSeenSource } = getLastSeen(account)
  const activityBadge = getActivityBadge(lastSeenTime)

  // عدد الإشعارات المخصصة
  const customCount = Object.values(localNotify).filter(v => v !== null).length

  return (
    <div className="glass rounded-xl border border-cyber-border hover:border-ig-purple/30 transition-all duration-200 overflow-hidden">
      {/* شريط ملون أعلى */}
      <div className={`h-1 ${account.isTracked ? 'ig-gradient' : 'bg-cyber-border'}`} />

      <div className="p-4">
        {/* رأس البطاقة */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative shrink-0">
            {showAvatar ? (
              <Image src={account.avatar!} alt={account.username} width={44} height={44}
                className="rounded-full object-cover border-2 border-ig-purple/30"
                onError={() => setImgError(true)} unoptimized />
            ) : (
              <div className="w-11 h-11 rounded-full ig-gradient flex items-center justify-center text-white font-bold text-base">
                {account.username[0]?.toUpperCase()}
              </div>
            )}
            {account.isTracked && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-cyber-bg" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-cyber-text text-sm truncate max-w-[120px]">
                {account.fullName || account.username}
              </p>
              <Badge variant={statusVariant[account.status] || 'default'} size="sm" dot>
                {getStatusText(account.status)}
              </Badge>
            </div>
            <a href={`https://instagram.com/${account.username}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-ig-purple hover:text-ig-pink transition-colors mt-0.5">
              <span>@{account.username}</span>
              <ExternalLink size={9} />
            </a>
          </div>

          {/* أزرار الرأس */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => setShowNotify(!showNotify)}
              className={`p-1.5 rounded-lg transition-all relative ${showNotify ? 'text-ig-orange bg-ig-orange/10' : 'text-cyber-muted hover:text-ig-orange hover:bg-ig-orange/10'}`}
              title="إشعارات مخصصة">
              <Bell size={12} />
              {customCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-ig-orange text-[8px] font-bold text-white flex items-center justify-center">
                  {customCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setEditMode(!editMode); setManualFollowers(String(account.followers)); setManualFollowing(String(account.following)); setManualPosts(String(account.posts)); }}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-ig-purple hover:bg-ig-purple/10 transition-all" title="تحديث يدوي">
              <Edit2 size={11} />
            </button>
            <button onClick={handleSync} disabled={loadingSync}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-ig-purple hover:bg-ig-purple/10 transition-all disabled:opacity-40" title="مزامنة من Instagram">
              <RefreshCw size={12} className={loadingSync ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* لوحة الإشعارات المخصصة */}
        {showNotify && (
          <div className="mb-3 p-3 rounded-xl bg-cyber-bg border border-ig-orange/20 space-y-1">
            <p className="text-[11px] font-semibold text-ig-orange flex items-center gap-1.5 mb-2">
              <Bell size={11} /> إشعارات @{account.username}
              <span className="text-cyber-muted font-normal mr-auto text-[10px]">عام = اتبع الإعداد الكلي</span>
            </p>
            <NotifyToggle label="متابعون جدد"   emoji="📈" value={localNotify.notifyOnFollow}    onChange={v => setLocalNotify(s => ({ ...s, notifyOnFollow: v }))} />
            <NotifyToggle label="فقدان متابعين" emoji="📉" value={localNotify.notifyOnUnfollow}  onChange={v => setLocalNotify(s => ({ ...s, notifyOnUnfollow: v }))} />
            <NotifyToggle label="منشور جديد"    emoji="📸" value={localNotify.notifyOnNewPost}   onChange={v => setLocalNotify(s => ({ ...s, notifyOnNewPost: v }))} />
            <NotifyToggle label="ستوري جديدة"   emoji="🔴" value={localNotify.notifyOnNewStory}  onChange={v => setLocalNotify(s => ({ ...s, notifyOnNewStory: v }))} />
            <NotifyToggle label="تغيير السيرة"  emoji="✏️" value={localNotify.notifyOnBioChange} onChange={v => setLocalNotify(s => ({ ...s, notifyOnBioChange: v }))} />
            <div className="flex gap-2 mt-2">
              <button onClick={handleSaveNotify} disabled={savingNotify}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-ig-orange/20 text-ig-orange text-xs hover:bg-ig-orange/30 transition-all disabled:opacity-50">
                {savingNotify ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />} حفظ
              </button>
              <button onClick={() => setShowNotify(false)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cyber-border text-cyber-muted text-xs hover:bg-cyber-card transition-all">
                <X size={11} /> إغلاق
              </button>
            </div>
          </div>
        )}

        {/* السيرة الذاتية */}
        {account.bio && !editMode && !showNotify && (
          <p className="text-[11px] text-cyber-muted mb-3 line-clamp-2 leading-relaxed">{account.bio}</p>
        )}

        {/* الإحصائيات */}
        {editMode ? (
          <div className="space-y-2 mb-3">
            <p className="text-[10px] text-ig-purple font-medium">✏️ أدخل القيم يدوياً:</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'متابعون', value: manualFollowers, set: setManualFollowers },
                { label: 'يتابع',   value: manualFollowing, set: setManualFollowing },
                { label: 'منشورات', value: manualPosts,     set: setManualPosts },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-[10px] text-cyber-muted">{label}</label>
                  <input type="number" value={value} onChange={e => set(e.target.value)} min="0"
                    className="w-full bg-cyber-bg border border-ig-purple/30 rounded-lg px-2 py-1.5 text-xs text-cyber-text focus:outline-none focus:border-ig-purple text-center" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleManualSave}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-ig-purple/20 text-ig-purple text-xs hover:bg-ig-purple/30 transition-all">
                <Check size={11} /> حفظ
              </button>
              <button onClick={() => setEditMode(false)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cyber-border text-cyber-muted text-xs hover:bg-cyber-card transition-all">
                <X size={11} /> إلغاء
              </button>
            </div>
          </div>
        ) : (
          !showNotify && (
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { label: 'متابعون', value: account.followers, icon: <Users size={11} /> },
                { label: 'يتابع',   value: account.following, icon: <UserCheck size={11} /> },
                { label: 'منشورات', value: account.posts,     icon: <FileText size={11} /> },
              ].map(stat => (
                <div key={stat.label} className="bg-cyber-card rounded-lg p-2 text-center border border-cyber-border">
                  <div className="flex items-center justify-center gap-1 text-cyber-muted mb-0.5">{stat.icon}</div>
                  <p className="text-sm font-bold text-cyber-text">{formatNumber(stat.value)}</p>
                  <p className="text-[10px] text-cyber-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* آخر ظهور / نشاط */}
        {!editMode && !showNotify && (
          <div className="mb-3 space-y-1">
            {activityBadge && lastSeenTime && (
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium ${activityBadge.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {activityBadge.label}
              </div>
            )}
            {lastSeenTime && (
              <p className="text-[11px] text-cyber-muted flex items-center gap-1">
                <Activity size={10} className="text-ig-purple shrink-0" />
                {lastSeenSource}: <span className="text-cyber-text mr-0.5">{timeAgo(lastSeenTime)}</span>
              </p>
            )}
            {account.lastPostTime && (
              <p className="text-[11px] text-cyber-muted flex items-center gap-1">
                <ImageIcon size={10} className="text-ig-pink shrink-0" />
                آخر منشور: {timeAgo(account.lastPostTime)}
              </p>
            )}
            {account.lastStoryTime && (
              <p className="text-[11px] text-cyber-muted flex items-center gap-1">
                <Clock size={10} className="text-ig-orange shrink-0" />
                آخر ستوري: {timeAgo(account.lastStoryTime)}
                <span className="text-[9px] text-green-400 mr-0.5">(≈ آخر دخول)</span>
              </p>
            )}
            {!lastSeenTime && (
              <p className="text-[11px] text-cyber-muted">لم يُفحص بعد — اضغط ↺ للمزامنة</p>
            )}
          </div>
        )}

        {/* أزرار الإجراءات */}
        {!editMode && !showNotify && (
          <div className="flex items-center gap-2">
            <Button variant={account.isTracked ? 'secondary' : 'primary'} size="sm"
              onClick={handleToggle} loading={loadingToggle} icon={<Power size={13} />} className="flex-1 text-xs">
              {account.isTracked ? 'إيقاف' : 'تشغيل'}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={loadingDelete} icon={<Trash2 size={13} />}>
              حذف
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
