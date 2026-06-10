// مكوّنات التحميل
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// تحميل دوار
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('animate-spin text-ig-purple', className)}
      size={20}
    />
  )
}

// شاشة تحميل كاملة
export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full ig-gradient animate-spin opacity-70" />
          <div className="absolute inset-1 rounded-full bg-cyber-bg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold ig-gradient-text">α</span>
          </div>
        </div>
        <p className="text-cyber-muted text-sm animate-pulse">
          جارٍ التحميل...
        </p>
      </div>
    </div>
  )
}

// هيكل تحميل للكروت (Skeleton)
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass rounded-xl p-5 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full shimmer bg-cyber-border" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-cyber-border rounded shimmer w-3/4" />
              <div className="h-3 bg-cyber-border rounded shimmer w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-cyber-border rounded shimmer" />
            <div className="h-3 bg-cyber-border rounded shimmer w-5/6" />
          </div>
        </div>
      ))}
    </>
  )
}

// هيكل تحميل للصف
export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-14 bg-cyber-border/50 rounded-lg shimmer animate-pulse"
        />
      ))}
    </div>
  )
}
