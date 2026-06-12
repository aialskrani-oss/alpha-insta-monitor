'use client'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { BarChart2, TrendingUp, TrendingDown, Users, Activity, Clock, Image, RefreshCw } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { formatNumber, formatDate, timeAgo } from '@/lib/utils'
import type { Account, FollowerSnapshot } from '@/types'

const PIE_COLORS = ['#833AB4', '#E1306C', '#F77737', '#405DE6', '#FCAF45']

interface AccountWithSnapshots extends Account {
  snapshots?: FollowerSnapshot[]
}

export default function AnalyticsPage() {
  const [accounts, setAccounts] = useState<AccountWithSnapshots[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<FollowerSnapshot[]>([])
  const [loadingSnap, setLoadingSnap] = useState(false)

  useEffect(() => {
    fetch('/api/accounts')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAccounts(d.data)
          if (d.data.length > 0) setSelectedAccountId(d.data[0].id)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedAccountId) return
    setLoadingSnap(true)
    fetch(`/api/accounts/${selectedAccountId}/snapshots`)
      .then(r => r.json())
      .then(d => { if (d.success) setSnapshots(d.data) })
      .finally(() => setLoadingSnap(false))
  }, [selectedAccountId])

  const totalFollowers = accounts.reduce((s, a) => s + a.followers, 0)
  const totalPosts = accounts.reduce((s, a) => s + a.posts, 0)
  const avgFollowers = accounts.length ? Math.round(totalFollowers / accounts.length) : 0

  // حساب نمو المتابعين من الـ snapshots
  const followerGrowth = (() => {
    if (snapshots.length < 2) return 0
    const first = snapshots[0].followers
    const last = snapshots[snapshots.length - 1].followers
    return last - first
  })()

  const accountsCompare = accounts.slice(0, 8).map(a => ({
    name: '@' + a.username,
    followers: a.followers,
    following: a.following,
    posts: a.posts,
  }))

  const statusData = [
    { name: 'نشط', value: accounts.filter(a => a.status === 'ACTIVE').length },
    { name: 'متوقف', value: accounts.filter(a => a.status === 'INACTIVE').length },
    { name: 'خطأ', value: accounts.filter(a => a.status === 'ERROR').length },
    { name: 'انتظار', value: accounts.filter(a => a.status === 'PENDING').length },
  ].filter(d => d.value > 0)

  // بيانات الرسم البياني من snapshots حقيقية
  const chartData = snapshots.map(s => ({
    date: formatDate(s.recordedAt),
    followers: s.followers,
    following: s.following,
    posts: s.posts,
  }))

  const selectedAccount = accounts.find(a => a.id === selectedAccountId)

  // آخر نشاط
  const getLastActivity = (acc: Account) => {
    const times = [acc.lastPostTime, acc.lastStoryTime, acc.lastChecked].filter(Boolean) as string[]
    if (!times.length) return null
    return times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-cyber-text">الإحصائيات</h1>
        <p className="text-sm text-cyber-muted mt-0.5">تحليل شامل لأداء الحسابات المراقبة</p>
      </div>

      {/* ملخص سريع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المتابعين', value: formatNumber(totalFollowers), icon: <Users size={16} />, color: 'text-ig-purple' },
          { label: 'متوسط المتابعين', value: formatNumber(avgFollowers), icon: <Activity size={16} />, color: 'text-ig-pink' },
          {
            label: followerGrowth >= 0 ? 'نمو المتابعين' : 'تراجع المتابعين',
            value: (followerGrowth >= 0 ? '+' : '') + formatNumber(followerGrowth),
            icon: followerGrowth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
            color: followerGrowth >= 0 ? 'text-green-400' : 'text-red-400',
          },
          { label: 'إجمالي المنشورات', value: formatNumber(totalPosts), icon: <Image size={16} />, color: 'text-ig-orange' },
        ].map((item) => (
          <div key={item.label} className="glass rounded-xl p-4 border border-cyber-border">
            <div className={`mb-2 ${item.color}`}>{item.icon}</div>
            <p className="text-xl font-bold text-cyber-text">{item.value}</p>
            <p className="text-xs text-cyber-muted mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* اختيار حساب لعرض تفاصيله */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader title="تفاصيل حساب - منحنى المتابعين الحقيقي" icon={<TrendingUp size={16} />} />
          <div className="flex gap-2 flex-wrap mb-4">
            {accounts.map(acc => (
              <button key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedAccountId === acc.id
                    ? 'border-ig-purple/50 bg-ig-purple/10 text-ig-purple'
                    : 'border-cyber-border text-cyber-muted hover:border-ig-purple/20'
                }`}
              >
                @{acc.username}
              </button>
            ))}
          </div>

          {selectedAccount && (
            <div className="mb-3 flex items-center gap-4 flex-wrap text-xs text-cyber-muted">
              <span className="flex items-center gap-1">
                <Users size={11} className="text-ig-purple" /> {formatNumber(selectedAccount.followers)} متابع
              </span>
              <span className="flex items-center gap-1">
                <Image size={11} className="text-ig-orange" /> {formatNumber(selectedAccount.posts)} منشور
              </span>
              {getLastActivity(selectedAccount) && (
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-ig-pink" /> آخر نشاط: {timeAgo(getLastActivity(selectedAccount)!)}
                </span>
              )}
              {selectedAccount.lastChecked && (
                <span className="flex items-center gap-1">
                  <RefreshCw size={11} className="text-green-400" /> آخر مزامنة: {timeAgo(selectedAccount.lastChecked)}
                </span>
              )}
            </div>
          )}

          {loadingSnap ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-ig-purple/30 border-t-ig-purple rounded-full animate-spin" />
            </div>
          ) : chartData.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-cyber-muted text-sm flex-col gap-2">
              <TrendingUp size={24} className="opacity-30" />
              <p>لا توجد بيانات كافية بعد</p>
              <p className="text-xs">يتراكم المنحنى تلقائياً مع كل مزامنة</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#833AB4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#833AB4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#565f89', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={formatNumber} tick={{ fill: '#565f89', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#111118', border: '1px solid rgba(131,58,180,0.3)', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#565f89' }}
                    itemStyle={{ color: '#c0caf5' }}
                  />
                  <Area type="monotone" dataKey="followers" name="متابعون" stroke="#833AB4" strokeWidth={2} fill="url(#grad1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* مقارنة الحسابات والتوزيع */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="مقارنة الحسابات (متابعون)" icon={<BarChart2 size={16} />} />
          {accounts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-cyber-muted text-sm">لا توجد حسابات بعد</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accountsCompare} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatNumber} tick={{ fill: '#565f89', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(131,58,180,0.3)', borderRadius: 8, fontSize: 11 }} itemStyle={{ color: '#c0caf5' }} />
                  <Bar dataKey="followers" name="متابعون" fill="#833AB4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="توزيع حالات الحسابات" icon={<Activity size={16} />} />
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-cyber-muted text-sm">لا توجد بيانات</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend formatter={(value) => <span className="text-xs text-cyber-muted">{value}</span>} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(131,58,180,0.3)', borderRadius: 8, fontSize: 11 }} itemStyle={{ color: '#c0caf5' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* جدول آخر نشاط لكل حساب */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader title="آخر نشاط لكل حساب" icon={<Clock size={16} />} />
          <div className="divide-y divide-cyber-border">
            {accounts.map(acc => {
              const lastActivity = getLastActivity(acc)
              return (
                <div key={acc.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {acc.avatar ? (
                      <img src={acc.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg ig-gradient flex items-center justify-center text-xs font-bold text-white">
                        {acc.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-cyber-text">@{acc.username}</p>
                      {acc.fullName && <p className="text-xs text-cyber-muted">{acc.fullName}</p>}
                    </div>
                  </div>
                  <div className="text-left space-y-0.5">
                    <p className="text-xs text-cyber-text text-left">{formatNumber(acc.followers)} متابع</p>
                    <p className="text-xs text-cyber-muted text-left">
                      {lastActivity ? timeAgo(lastActivity) : 'لم يُفحص بعد'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
