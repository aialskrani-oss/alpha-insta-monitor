// مكوّن الحالة الفارغة
import { Instagram, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  onAddAccount?: () => void
}

export function EmptyState({ onAddAccount }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* أيقونة متحركة */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl ig-gradient opacity-20 absolute inset-0 blur-xl" />
        <div className="w-24 h-24 rounded-3xl ig-gradient/10 border border-ig-purple/20 flex items-center justify-center relative">
          <Instagram size={40} className="text-ig-purple opacity-60" />
        </div>
      </div>

      {/* النص */}
      <h3 className="text-xl font-bold text-cyber-text mb-2">
        لا توجد حسابات مراقبة
      </h3>
      <p className="text-sm text-cyber-muted max-w-xs mb-6">
        أضف حسابات إنستغرام للبدء في مراقبة نموها وتتبع التغيرات تلقائياً
      </p>

      {/* زر الإضافة */}
      {onAddAccount && (
        <Button
          onClick={onAddAccount}
          icon={<Plus size={16} />}
          size="lg"
        >
          إضافة أول حساب
        </Button>
      )}

      {/* نقاط زخرفية */}
      <div className="flex gap-2 mt-8 opacity-30">
        {['bg-ig-pink', 'bg-ig-purple', 'bg-ig-orange'].map((c) => (
          <div key={c} className={`w-2 h-2 rounded-full ${c}`} />
        ))}
      </div>
    </div>
  )
}
