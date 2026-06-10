'use client'
// مكوّن حقل الإدخال مع دعم الأيقونات والأخطاء
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, iconLeft, iconRight, fullWidth = true, className, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-cyber-text">
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted pointer-events-none">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-cyber-card border rounded-lg px-4 py-2.5 text-sm text-cyber-text placeholder:text-cyber-muted',
              'transition-all duration-200 outline-none',
              'focus:border-ig-purple/60 focus:ring-2 focus:ring-ig-purple/20',
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                : 'border-cyber-border',
              iconLeft && 'pr-10',
              iconRight && 'pl-10',
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-cyber-muted">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
