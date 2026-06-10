'use client'
// مكوّن النافذة المنبثقة
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  className,
}: ModalProps) {
  // إغلاق عند الضغط على Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  // منع التمرير عند فتح النافذة
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [open])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* الخلفية الشفافة */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* محتوى النافذة */}
      <div
        className={cn(
          'relative w-full glass rounded-2xl shadow-card animate-enter',
          'border border-ig-purple/20',
          sizes[size],
          className
        )}
      >
        {/* رأس النافذة */}
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-cyber-border">
            <h2 className="text-base font-semibold text-cyber-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-border transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* المحتوى */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
