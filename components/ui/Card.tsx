// مكوّن الكرت الزجاجي
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  className,
  hover = false,
  gradient = false,
  padding = 'md',
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  }

  return (
    <div
      className={cn(
        'glass rounded-xl',
        paddings[padding],
        hover && 'glass-hover cursor-pointer',
        gradient && 'gradient-border',
        className
      )}
    >
      {children}
    </div>
  )
}

// عنوان الكرت
interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-ig-purple/10 text-ig-purple">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-cyber-text">{title}</h3>
          {subtitle && (
            <p className="text-xs text-cyber-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
