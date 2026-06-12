'use client'
// صفحة عرض عامة لأصحاب أكواد الإحالة - قراءة فقط
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Users, Eye, Clock, TrendingUp, TrendingDown, Activity, Image, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { formatNumber, timeAgo, formatDate, getActivityText, getStatusText, getStatusColor } from '@/lib/utils'
import type { Account, Activity as ActivityType, FollowerSnapshot } from '@/types'

interface AccountWithDetails extends Account {
  activities: ActivityType[]
  snapshots: FollowerSnapshot[]
}

interface ReferralInfo {
  label?: string | null
  expiresAt?: string | null
  maxUses: number
  usedCount: number
}

function ViewContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [accounts, setAccounts] = useState<AccountWithDetails[]>([])
  const [referral, setReferral] = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'expired' | 'maxed' | 'notfound' | 'error' | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  useEffect(() => {
    if (!code) {
      setError('لم يتم تقديم كود إحالة')
      setErrorType('notfound')
      setLoading(false)
      return
    }
    fetchData()
  }, [code])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/referral/view?code=${code}`)
      const data = await res.json()
      if (data.success) {
        setAccounts(data.data.accounts)
        setReferral(data.data.referral)
        if (data.data.accounts.length > 0) {
          setSelectedAccount(data.data.accounts[0].id)
        }
      } else {
        setError(data.error || 'خطأ في جلب البيانات')
        setErrorType(data.expired ? 'expired' : data.maxed ? 'maxed' : 'notfound')
      }
    } catch {
      setError('خطأ في الاتصال')
      setErrorType('error')
    } finally {
      setLoading(false)
    }
  }

  const selectedAcc = accounts.find(a => a.id === selectedAccount)

  const getLastActivity = (acc: AccountWithDetails) => {
    const times = [acc.lastPostTime, acc.lastStoryTime, acc.lastChecked].filter(Boolean) as string[]
    if (times.length === 0) return null
    return times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-ig-purple/30 border-t-ig-purple rounded-full animate-spin mx-auto" />
          <p className="text-cyber-muted text-sm">جارٍ التحميل...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4" dir="rtl">
        <div className="glass rounded-2xl border border-cyber-border p-8 text-center max-w-md w-full">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-cyber-text mb-2">
            {errorType === 'expired' ? 'انتهت الصلاحية' : errorType === 'maxed' ? 'تم استنفاد الكود' : 'كود غير صالح'}
          </h1>
          <p className="text-sm text-cyber-muted">{error}</p>
          {errorType === 'expired' && (
            <p className="text-xs text-cyber-muted mt-3">يرجى طلب كود جديد من المشرف</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text" dir="rtl">
      {/* الهيدر */}
      <div className="border-b border-cyber-border bg-cyber-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl ig-gradient flex items-center justify-center">
              <Eye size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-cyber-text">
                {referral?.label ? referral.label : 'مراقبة Instagram'}
              </h1>
              <p className="text-xs text-cyber-muted">قراءة فقط · {accounts.length} حساب</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle size={12} /> مباشر
            </span>
            {referral?.expiresAt && (
              <span className="text-xs text-cyber-muted hidden sm:block">
                <Clock size={10} className="inline ml-1" />
                ينتهي {formatDate(referral.expiresAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* الحسابات - تبويبات */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccount(acc.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm shrink-0 transition-all border ${
                selectedAccount === acc.id
                  ? 'border-ig-purple/50 bg-ig-purple/10 text-cyber-text'
                  : 'border-cyber-border bg-cyber-card text-cyber-muted hover:border-ig-purple/20'
              }`}
            >
              {acc.avatar ? (
                <img src={acc.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full ig-gradient flex items-center justify-center text-[10px] font-bold text-white">
                  {acc.username[0].toUpperCase()}
                </div>
              )}
              <span>@{acc.username}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'ACTIVE' ? 'bg-green-400' : 'bg-gray-500'}`} />
            </button>
          ))}
        </div>

        {selectedAcc && (
          <div className="space-y-5">
            {/* بطاقة الحساب الرئيسية */}
            <div className="glass rounded-2xl border border-cyber-border p-5">
              <div className="flex items-start gap-4">
                {selectedAcc.avatar ? (
                  <img src={selectedAcc.avatar} alt={selectedAcc.username}
                    className="w-16 h-16 rounded-2xl object-cover border border-cyber-border shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl ig-gradient flex items-center justify-center text-2xl font-bold text-white shrink-0">
                    {selectedAcc.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-cyber-text">@{selectedAcc.username}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      selectedAcc.status === 'ACTIVE' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-gray-500/30 text-gray-400'
                    }`}>
                      {getStatusText(selectedAcc.status)}
                    </span>
                  </div>
                  {selectedAcc.fullName && <p className="text-sm text-cyber-muted mt-0.5">{selectedAcc.fullName}</p>}
                  {selectedAcc.bio && <p className="text-xs text-cyber-muted mt-1.5 line-clamp-2">{selectedAcc.bio}</p>}
                  {getLastActivity(selectedAcc) && (
                    <p className="text-xs text-ig-purple mt-2 flex items-center gap-1">
                      <Activity size={11} /> آخر نشاط: {timeAgo(getLastActivity(selectedAcc)!)}
                    </p>
                  )}
                </div>
              </div>

              {/* الإحصائيات */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                  { label: 'متابعون', value: selectedAcc.followers, icon: <Users size={14} />, color: 'text-ig-purple' },
                  { label: 'يتابع', value: selectedAcc.following, icon: <Users size={14} />, color: 'text-ig-pink' },
                  { label: 'منشورات', value: selectedAcc.posts, icon: <Image size={14} />, color: 'text-ig-orange' },
                ].map(item => (
                  <div key={item.label} className="bg-cyber-bg rounded-xl p-3 border border-cyber-border text-center">
                    <div className={`${item.color} flex justify-center mb-1`}>{item.icon}</div>
                    <p className="text-lg font-bold text-cyber-text">{formatNumber(item.value)}</p>
                    <p className="text-xs text-cyber-muted">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* آخر فحص */}
              {selectedAcc.lastChecked && (
                <p className="text-xs text-cyber-muted mt-3 flex items-center gap-1">
                  <RefreshCw size={10} /> آخر مزامنة: {timeAgo(selectedAcc.lastChecked)}
                </p>
              )}
            </div>

            {/* مخطط المتابعين من الـ snapshots */}
            {selectedAcc.snapshots.length > 1 && (
              <div className="glass rounded-2xl border border-cyber-border p-5">
                <h3 className="text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
                  <TrendingUp size={15} className="text-ig-purple" /> تطور المتابعين
                </h3>
                <div className="space-y-2">
                  {selectedAcc.snapshots.slice(-10).map((snap, i, arr) => {
                    const prev = arr[i - 1]
                    const diff = prev ? snap.followers - prev.followers : 0
                    return (
                      <div key={snap.id} className="flex items-center justify-between text-xs">
                        <span className="text-cyber-muted">{formatDate(snap.recordedAt)}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-cyber-text font-medium">{formatNumber(snap.followers)}</span>
                          {diff !== 0 && (
                            <span className={`flex items-center gap-0.5 ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* سجل النشاطات */}
            {selectedAcc.activities.length > 0 && (
              <div className="glass rounded-2xl border border-cyber-border p-5">
                <h3 className="text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
                  <Activity size={15} className="text-ig-pink" /> سجل النشاطات
                </h3>
                <div className="space-y-2">
                  {selectedAcc.activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-cyber-border/50 last:border-0">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        activity.type === 'FOLLOWER_GAIN' ? 'bg-green-400' :
                        activity.type === 'FOLLOWER_LOSS' ? 'bg-red-400' :
                        activity.type === 'NEW_POST' ? 'bg-ig-purple' :
                        activity.type === 'NEW_STORY' ? 'bg-ig-pink' :
                        'bg-ig-orange'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-cyber-text">{activity.message}</p>
                        <p className="text-[10px] text-cyber-muted mt-0.5">{timeAgo(activity.createdAt)}</p>
                      </div>
                      <span className="text-[10px] text-cyber-muted shrink-0">{getActivityText(activity.type)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAcc.activities.length === 0 && selectedAcc.snapshots.length === 0 && (
              <div className="text-center py-10 glass rounded-2xl border border-cyber-border">
                <Activity size={32} className="text-cyber-muted mx-auto mb-2 opacity-40" />
                <p className="text-sm text-cyber-muted">لا توجد نشاطات مسجلة بعد</p>
              </div>
            )}
          </div>
        )}

        {accounts.length === 0 && (
          <div className="text-center py-16">
            <Users size={48} className="text-cyber-muted mx-auto mb-3 opacity-30" />
            <p className="text-cyber-muted">لا توجد حسابات لعرضها</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-cyber-border mt-8 py-4 text-center">
        <p className="text-xs text-cyber-muted">وضع العرض فقط · لا يمكن تعديل أي بيانات</p>
      </div>
    </div>
  )
}

export default function ViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-ig-purple/30 border-t-ig-purple rounded-full animate-spin" />
      </div>
    }>
      <ViewContent />
    </Suspense>
  )
}
