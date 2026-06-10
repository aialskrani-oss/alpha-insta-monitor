'use client'
// صفحة إدارة أكواد الإحالة
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Copy, Trash2, Share2, Check } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import type { ReferralCode } from '@/types'

export default function ReferralsPage() {
  const [codes, setCodes] = useState<(ReferralCode & { usedBy?: { name: string; email: string }[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/referral')
      const data = await res.json()
      if (data.success) setCodes(data.data)
    } catch {
      toast.error('فشل تحميل الأكواد')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 30 }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم إنشاء كود إحالة جديد ✅')
        setCodes(prev => [data.data, ...prev])
      } else {
        toast.error(data.error || 'فشل إنشاء الكود')
      }
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الكود؟')) return
    try {
      const res = await fetch('/api/referral', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        toast.success('تم حذف الكود')
        setCodes(prev => prev.filter(c => c.id !== id))
      }
    } catch {
      toast.error('فشل حذف الكود')
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    toast.success('تم نسخ الكود!')
    setTimeout(() => setCopied(null), 2000)
  }

  const activeCount = codes.filter(c => !c.isUsed).length
  const usedCount = codes.filter(c => c.isUsed).length

  return (
    <div className="space-y-5 max-w-3xl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">أكواد الإحالة</h1>
          <p className="text-sm text-cyber-muted mt-0.5">
            تحكم في من يستطيع الوصول للنظام
          </p>
        </div>
        <Button
          onClick={handleCreate}
          loading={creating}
          icon={<Plus size={15} />}
        >
          إنشاء كود جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إجمالي الأكواد', value: codes.length, color: 'text-cyber-text' },
          { label: 'أكواد نشطة', value: activeCount, color: 'text-green-400' },
          { label: 'مستخدمة', value: usedCount, color: 'text-ig-muted' },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 border border-cyber-border text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-cyber-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* قائمة الأكواد */}
      <Card>
        <CardHeader title="الأكواد" icon={<Share2 size={16} />} />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-cyber-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-10">
            <Share2 size={32} className="text-cyber-muted mx-auto mb-2 opacity-40" />
            <p className="text-sm text-cyber-muted">لا توجد أكواد بعد</p>
            <p className="text-xs text-cyber-muted mt-1">اضغط &quot;إنشاء كود جديد&quot; للبدء</p>
          </div>
        ) : (
          <div className="space-y-2">
            {codes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between p-4 rounded-xl bg-cyber-card border border-cyber-border hover:border-ig-purple/20 transition-colors"
              >
                {/* الكود */}
                <div className="flex items-center gap-3">
                  <code className={`font-mono text-base font-bold tracking-widest ${code.isUsed ? 'text-cyber-muted line-through' : 'ig-gradient-text'}`}>
                    {code.code}
                  </code>
                  <div className="flex items-center gap-2">
                    <Badge variant={code.isUsed ? 'default' : 'success'} dot>
                      {code.isUsed ? 'مستخدم' : 'نشط'}
                    </Badge>
                    {code.expiresAt && (
                      <Badge variant="warning" size="sm">
                        ينتهي {formatDate(code.expiresAt)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* الإجراءات */}
                <div className="flex items-center gap-2">
                  {!code.isUsed && (
                    <button
                      onClick={() => handleCopy(code.code)}
                      className="p-2 rounded-lg text-cyber-muted hover:text-ig-purple hover:bg-ig-purple/10 transition-all"
                      title="نسخ الكود"
                    >
                      {copied === code.code ? (
                        <Check size={15} className="text-green-400" />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(code.id)}
                    className="p-2 rounded-lg text-cyber-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="حذف الكود"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* تعليمات الاستخدام */}
      <div className="glass rounded-xl p-4 border border-ig-purple/15 bg-ig-purple/5">
        <p className="text-sm text-cyber-text font-medium mb-2">📋 كيفية الاستخدام:</p>
        <ul className="text-xs text-cyber-muted space-y-1">
          <li>• أنشئ كود إحالة وأرسله للشخص المراد منحه صلاحية الوصول</li>
          <li>• يمكن لكل كود أن يُستخدم مرة واحدة فقط عند التسجيل</li>
          <li>• يمكنك تحديد تاريخ انتهاء للكود (افتراضي 30 يوم)</li>
          <li>• الأكواد المستخدمة تظهر باللون الرمادي ولا يمكن نسخها</li>
        </ul>
      </div>
    </div>
  )
}
