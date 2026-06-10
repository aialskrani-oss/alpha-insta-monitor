'use client'
// بطاقة الإحصائيات الرئيسية
import { cn, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  color?: 'pink' | 'purple' | 'orange' | 'green' | 'blue'
  loading?: boolean
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'purple',
  loading = false,
}: StatsCardProps) {
  const colors = {
    pink: {
      bg: 'bg-ig-pink/10',
      text: 'text-ig-pink',
      border: 'border-ig-pink/20',
      glow: 'shadow-ig',
    },
    purple: {
      bg: 'bg-ig-purple/10',
      text: 'text-ig-purple',
      border: 'border-ig-purple/20',
      glow: 'shadow-glow',
    },
    orange: {
      bg: 'bg-ig-orange/10',
      text: 'text-ig-orange',
      border: 'border-ig-orange/20',
      glow: '',
    },
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/20',
      glow: '',
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      glow: '',
    },
  }

  const c = colors[color]

  if (loading) {
    return (
      <div className="glass rounded-xl p-5 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyber-border shimmer" />
          <div className="w-16 h-5 bg-cyber-border rounded shimmer" />
        </div>
        <div className="w-24 h-8 bg-cyber-border rounded shimmer mb-2" />
        <div className="w-32 h-4 bg-cyber-border rounded shimmer" />
      </div>
    )
  }

  return (
    <div className={cn('glass rounded-xl p-5 border transition-all hover:-translate-y-1 duration-200', c.border)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', c.bg, c.glow)}>
          <span className={c.text}>{icon}</span>
        </div>
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            change > 0 ? 'bg-green-500/10 text-green-400' :
            change < 0 ? 'bg-red-500/10 text-red-400' :
            'bg-cyber-border text-cyber-muted'
          )}>
            {change > 0 ? <TrendingUp size={12} /> :
             change < 0 ? <TrendingDown size={12} /> :
             <Minus size={12} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-cyber-text">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>
        <p className="text-sm text-cyber-muted">{title}</p>
        {changeLabel && (
          <p className="text-xs text-cyber-muted opacity-70">{changeLabel}</p>
        )}
      </div>
    </div>
  )
}
