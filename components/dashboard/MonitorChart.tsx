'use client'
// رسم بياني تفاعلي لنمو المتابعين باستخدام Recharts
import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { generateChartData, formatNumber } from '@/lib/utils'
import { Card, CardHeader } from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'

const PERIODS = [
  { label: '7 أيام', days: 7 },
  { label: '30 يوم', days: 30 },
]

// Tooltip مخصص بتصميم دارك
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="glass rounded-xl p-3 border border-ig-purple/20 shadow-card text-xs">
      <p className="text-cyber-muted mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-cyber-muted">
            {entry.name === 'followers' ? 'متابعون' : 'متابَعون'}:
          </span>
          <span className="text-cyber-text font-semibold">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

interface MonitorChartProps {
  baseFollowers?: number
}

export function MonitorChart({ baseFollowers = 15000 }: MonitorChartProps) {
  const [period, setPeriod] = useState(7)
  const data = generateChartData(period, baseFollowers)

  return (
    <Card>
      <CardHeader
        title="نمو المتابعين"
        icon={<TrendingUp size={16} />}
        action={
          <div className="flex items-center gap-1 bg-cyber-card rounded-lg p-1 border border-cyber-border">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  period === p.days
                    ? 'bg-ig-purple/20 text-ig-pink'
                    : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="followersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#833AB4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#833AB4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="followingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E1306C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#E1306C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#565f89', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fill: '#565f89', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-cyber-muted">
                  {value === 'followers' ? 'متابعون' : 'متابَعون'}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="followers"
              stroke="#833AB4"
              strokeWidth={2}
              fill="url(#followersGrad)"
            />
            <Area
              type="monotone"
              dataKey="following"
              stroke="#E1306C"
              strokeWidth={2}
              fill="url(#followingGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
