'use client'
// صفحة الإحصائيات التفصيلية
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { BarChart2, TrendingUp, Users, Activity } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { generateChartData, formatNumber } from '@/lib/utils'
import type { Account } from '@/types'

const PIE_COLORS = ['#833AB4', '#E1306C', '#F77737', '#405DE6', '#FCAF45']

export default function AnalyticsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/accounts')
      .then(r => r.json())
      .then(d => { if (d.success) setAccounts(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const totalFollowers = accounts.reduce((s, a) => s + a.followers, 0)
  const chartData = generateChartData(30, totalFollowers)

  // بيانات المقارنة بين الحسابات
  const accountsCompare = accounts.slice(0, 8).map(a => ({
    name: '@' + a.username,
    followers: a.followers,
    following: a.following,
    posts: a.posts,
  }))

  // بيانات توزيع الحالات للرسم الدائري
  const statusData = [
    { name: 'نشط', value: accounts.filter(a => a.status === 'ACTIVE').length },
    { name: 'متوقف', value: accounts.filter(a => a.status === 'INACTIVE').length },
    { name: 'خطأ', value: accounts.filter(a => a.status === 'ERROR').length },
    { name: 'انتظار', value: accounts.filter(a => a.status === 'PENDING').length },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-5">
      {/* رأس الصفحة */}
      <div>
        <h1 className="text-2xl font-bold text-cyber-text">الإحصائيات</h1>
        <p className="text-sm text-cyber-muted mt-0.5">
          تحليل شامل لأداء الحسابات المراقبة
        </p>
      </div>

      {/* ملخص سريع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المتابعين', value: formatNumber(totalFollowers), icon: <Users size={16} />, color: 'text-ig-purple' },
          { label: 'متوسط المتابعين', value: accounts.length ? formatNumber(Math.round(totalFollowers / accounts.length)) : '0', icon: <Activity size={16} />, color: 'text-ig-pink' },
          { label: 'نمو هذا الشهر', value: '+2.4K', icon: <TrendingUp size={16} />, color: 'text-green-400' },
          { label: 'حسابات مراقبة', value: String(accounts.filter(a => a.isTracked).length), icon: <BarChart2 size={16} />, color: 'text-ig-orange' },
        ].map((item) => (
          <div key={item.label} className="glass rounded-xl p-4 border border-cyber-border">
            <div className={`mb-2 ${item.color}`}>{item.icon}</div>
            <p className="text-xl font-bold text-cyber-text">{item.value}</p>
            <p className="text-xs text-cyber-muted mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* رسم نمو المتابعين - 30 يوم */}
      <Card>
        <CardHeader title="نمو المتابعين - آخر 30 يوم" icon={<TrendingUp size={16} />} />
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
              <XAxis dataKey="date" tick={{ fill: '#565f89', fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tickFormatter={formatNumber} tick={{ fill: '#565f89', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111118', border: '1px solid rgba(131,58,180,0.3)', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#565f89' }}
                itemStyle={{ color: '#c0caf5' }}
              />
              <Area type="monotone" dataKey="followers" stroke="#833AB4" strokeWidth={2} fill="url(#grad1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* مقارنة الحسابات والتوزيع */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* مقارنة عمودية */}
        <Card>
          <CardHeader title="مقارنة الحسابات (متابعون)" icon={<BarChart2 size={16} />} />
          {accounts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-cyber-muted text-sm">
              لا توجد حسابات بعد
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accountsCompare} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatNumber} tick={{ fill: '#565f89', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#111118', border: '1px solid rgba(131,58,180,0.3)', borderRadius: 8, fontSize: 11 }}
                    itemStyle={{ color: '#c0caf5' }}
                  />
                  <Bar dataKey="followers" fill="#833AB4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* توزيع الحالات */}
        <Card>
          <CardHeader title="توزيع حالات الحسابات" icon={<Activity size={16} />} />
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-cyber-muted text-sm">
              لا توجد بيانات
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span className="text-xs text-cyber-muted">{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{ background: '#111118', border: '1px solid rgba(131,58,180,0.3)', borderRadius: 8, fontSize: 11 }}
                    itemStyle={{ color: '#c0caf5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
