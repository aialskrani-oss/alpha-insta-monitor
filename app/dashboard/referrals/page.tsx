'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Copy, Trash2, Share2, Check, ExternalLink, Users, Clock, Hash, ChevronDown, ChevronUp, Settings2, Eye } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate, timeAgo } from '@/lib/utils'
import type { ReferralCode, Account } from '@/types'

interface CodeForm {
  label: string
  expiresInDays: string
  maxUses: string
  allowedAccounts: string[]
}

export default function ReferralsPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<CodeForm>({
    label: '',
    expiresInDays: '30',
    maxUses: '1',
    allowedAccounts: [],
  })

  useEffect(() => {
    fetchCodes()
    fetchAccounts()
  }, [])

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/referral')
      const data = await res.json()
      if (data.success) setCodes(data.data)
    } catch { toast.error('فشل تحميل الأكواد') }
    finally { setLoading(false) }
  }

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      const data = await res.json()
      if (data.success) setAccounts(data.data)
    } catch {}
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const payload: Record<string, unknown> = {
        label: form.label || undefined,
        expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined,
        maxUses: Number(form.maxUses) || 1,
        allowedAccounts: form.allowedAccounts.length > 0 ? form.allowedAccounts : undefined,
      }
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('✅ تم إنشاء كود إحالة جديد')
        setCodes(prev => [data.data, ...prev])
        setShowForm(false)
        setForm({ label: '', expiresInDays: '30', maxUses: '1', allowedAccounts: [] })
      } else toast.error(data.error || 'فشل إنشاء الكود')
    } catch { toast.error('خطأ في الاتصال') }
    finally { setCreating(false) }
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
    } catch { toast.error('فشل الحذف') }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    toast.success('تم نسخ الكود!')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/view?code=${code}`
    navigator.clipboard.writeText(link)
    toast.success('تم نسخ الرابط!')
  }

  const getCodeStatus = (code: ReferralCode) => {
    if (code.expiresAt && new Date(code.expiresAt) < new Date()) return 'expired'
    if (code.usedCount >= code.maxUses) return 'maxed'
    return 'active'
  }

  const getAllowedAccountNames = (code: ReferralCode) => {
    if (!code.allowedAccounts) return null
    try {
      const ids: string[] = JSON.parse(code.allowedAccounts)
      if (!ids.length) return null
      return ids.map(id => accounts.find(a => a.id === id)?.username || id).join(', ')
    } catch { return null }
  }

  const activeCount = codes.filter(c => getCodeStatus(c) === 'active').length
  const expiredCount = codes.filter(c => getCodeStatus(c) === 'expired' || getCodeStatus(c) === 'maxed').length

  return (
    <div className="space-y-5 max-w-3xl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">أكواد الإحالة</h1>
          <p className="text-sm text-cyber-muted mt-0.5">تحكم في الوصول والعرض لكل حساب</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} icon={<Plus size={15} />}>
          {showForm ? 'إلغاء' : 'إنشاء كود'}
        </Button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إجمالي الأكواد', value: codes.length, color: 'text-cyber-text' },
          { label: 'نشطة', value: activeCount, color: 'text-green-400' },
          { label: 'منتهية/مكتملة', value: expiredCount, color: 'text-cyber-muted' },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 border border-cyber-border text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-cyber-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* فورم إنشاء كود جديد */}
      {showForm && (
        <div className="glass rounded-2xl border border-ig-purple/30 p-5 space-y-4">
          <p className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <Settings2 size={15} className="text-ig-purple" /> إعدادات الكود الجديد
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* التسمية */}
            <div>
              <label className="block text-xs text-cyber-muted mb-1.5">تسمية (اختياري)</label>
              <input
                type="text"
                placeholder="مثال: كود لأحمد"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-3 py-2.5 text-sm text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-ig-purple transition-colors"
              />
            </div>

            {/* الصلاحية */}
            <div>
              <label className="block text-xs text-cyber-muted mb-1.5">صلاحية (بالأيام، 0 = بلا انتهاء)</label>
              <input
                type="number"
                min="0"
                placeholder="30"
                value={form.expiresInDays}
                onChange={e => setForm(f => ({ ...f, expiresInDays: e.target.value }))}
                className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-3 py-2.5 text-sm text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-ig-purple transition-colors"
              />
            </div>

            {/* الحد الأقصى للاستخدام */}
            <div>
              <label className="block text-xs text-cyber-muted mb-1.5">الحد الأقصى للاستخدام</label>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-3 py-2.5 text-sm text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-ig-purple transition-colors"
              />
            </div>
          </div>

          {/* اختيار الحسابات */}
          {accounts.length > 0 && (
            <div>
              <label className="block text-xs text-cyber-muted mb-2">
                <Users size={12} className="inline ml-1" />
                الحسابات المسموح بعرضها (فارغ = الكل)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {accounts.map(acc => (
                  <label key={acc.id} className="flex items-center gap-2 p-2 rounded-lg bg-cyber-bg border border-cyber-border cursor-pointer hover:border-ig-purple/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.allowedAccounts.includes(acc.id)}
                      onChange={e => setForm(f => ({
                        ...f,
                        allowedAccounts: e.target.checked
                          ? [...f.allowedAccounts, acc.id]
                          : f.allowedAccounts.filter(id => id !== acc.id)
                      }))}
                      className="accent-purple-500"
                    />
                    <span className="text-xs text-cyber-text truncate">@{acc.username}</span>
                  </label>
                ))}
              </div>
              {form.allowedAccounts.length > 0 && (
                <p className="text-xs text-ig-purple mt-1.5">✓ {form.allowedAccounts.length} حساب مختار</p>
              )}
            </div>
          )}

          <Button onClick={handleCreate} loading={creating} className="w-full" icon={<Plus size={15} />}>
            إنشاء الكود
          </Button>
        </div>
      )}

      {/* قائمة الأكواد */}
      <Card>
        <CardHeader title="الأكواد" icon={<Share2 size={16} />} />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-cyber-border rounded-xl animate-pulse" />)}
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-10">
            <Share2 size={32} className="text-cyber-muted mx-auto mb-2 opacity-40" />
            <p className="text-sm text-cyber-muted">لا توجد أكواد بعد</p>
            <p className="text-xs text-cyber-muted mt-1">اضغط &quot;إنشاء كود&quot; للبدء</p>
          </div>
        ) : (
          <div className="space-y-2">
            {codes.map((code) => {
              const status = getCodeStatus(code)
              const allowedNames = getAllowedAccountNames(code)
              const isExpanded = expandedId === code.id
              return (
                <div key={code.id} className="rounded-xl bg-cyber-card border border-cyber-border hover:border-ig-purple/20 transition-colors overflow-hidden">
                  {/* الصف الرئيسي */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className={`font-mono text-sm font-bold tracking-widest ${status === 'active' ? 'ig-gradient-text' : 'text-cyber-muted line-through'}`}>
                            {code.code}
                          </code>
                          {code.label && (
                            <span className="text-xs text-cyber-muted">— {code.label}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant={status === 'active' ? 'success' : 'default'} dot size="sm">
                            {status === 'active' ? 'نشط' : status === 'expired' ? 'منتهي' : 'مكتمل'}
                          </Badge>
                          <span className="text-xs text-cyber-muted flex items-center gap-1">
                            <Hash size={10} /> {code.usedCount}/{code.maxUses}
                          </span>
                          {code.expiresAt && (
                            <span className="text-xs text-cyber-muted flex items-center gap-1">
                              <Clock size={10} /> {new Date(code.expiresAt) > new Date() ? `ينتهي ${formatDate(code.expiresAt)}` : 'منتهي الصلاحية'}
                            </span>
                          )}
                          <span className="text-xs text-cyber-muted">{timeAgo(code.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {status === 'active' && (
                        <>
                          <button onClick={() => handleCopyCode(code.code)}
                            className="p-2 rounded-lg text-cyber-muted hover:text-ig-purple hover:bg-ig-purple/10 transition-all" title="نسخ الكود">
                            {copied === code.code ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                          <button onClick={() => handleCopyLink(code.code)}
                            className="p-2 rounded-lg text-cyber-muted hover:text-ig-pink hover:bg-ig-pink/10 transition-all" title="نسخ رابط العرض">
                            <ExternalLink size={14} />
                          </button>
                          <a href={`/view?code=${code.code}`} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg text-cyber-muted hover:text-green-400 hover:bg-green-500/10 transition-all" title="فتح صفحة العرض">
                            <Eye size={14} />
                          </a>
                        </>
                      )}
                      <button onClick={() => setExpandedId(isExpanded ? null : code.id)}
                        className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text transition-all">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => handleDelete(code.id)}
                        className="p-2 rounded-lg text-cyber-muted hover:text-red-400 hover:bg-red-500/10 transition-all" title="حذف">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* التوسعة */}
                  {isExpanded && (
                    <div className="border-t border-cyber-border px-4 py-3 bg-cyber-bg/40 space-y-2">
                      <p className="text-xs text-cyber-muted">
                        <span className="text-cyber-text font-medium">الحسابات المسموح بها:</span>{' '}
                        {allowedNames ? allowedNames : 'جميع الحسابات'}
                      </p>
                      <p className="text-xs text-cyber-muted">
                        <span className="text-cyber-text font-medium">رابط العرض:</span>{' '}
                        <code className="text-ig-purple text-[11px]">{typeof window !== 'undefined' ? window.location.origin : ''}/view?code={code.code}</code>
                      </p>
                      <p className="text-xs text-cyber-muted">
                        الكود للعرض فقط — لا يمكن للمستخدم تعديل أي شيء
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* تعليمات */}
      <div className="glass rounded-xl p-4 border border-ig-purple/15 bg-ig-purple/5 text-xs text-cyber-muted space-y-1">
        <p className="text-sm text-cyber-text font-medium mb-2">📋 كيفية الاستخدام:</p>
        <p>• أنشئ كوداً وأرسل رابط العرض للشخص المراد إطلاعه</p>
        <p>• يمكنه فتح الرابط مباشرة بدون تسجيل دخول — قراءة فقط</p>
        <p>• يمكنك تحديد أي حسابات يمكنه رؤيتها</p>
        <p>• الحد الأقصى للاستخدام: عدد مرات فتح الرابط (كل فتح = استخدام واحد)</p>
        <p>• أيقونة 🔗 لنسخ الكود، أيقونة ↗ لنسخ الرابط الكامل، أيقونة 👁 لمعاينة</p>
      </div>
    </div>
  )
}
