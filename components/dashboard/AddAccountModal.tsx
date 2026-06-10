'use client'
// نافذة إضافة حساب إنستغرام جديد
import { useState } from 'react'
import { toast } from 'sonner'
import { Instagram, AtSign } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Account } from '@/types'

interface AddAccountModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (account: Account) => void
}

export function AddAccountModal({ open, onClose, onSuccess }: AddAccountModalProps) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const clean = username.trim().replace(/^@/, '')
    if (!clean) {
      setError('اسم المستخدم مطلوب')
      return
    }
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(clean)) {
      setError('اسم مستخدم غير صالح (أحرف وأرقام فقط)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`تمت إضافة @${clean} بنجاح`)
        onSuccess(data.data)
        setUsername('')
        onClose()
      } else {
        setError(data.error || 'فشل إضافة الحساب')
        toast.error(data.error || 'فشل إضافة الحساب')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setUsername('')
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="إضافة حساب إنستغرام">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* أيقونة توضيحية */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl ig-gradient flex items-center justify-center shadow-ig">
            <Instagram size={28} className="text-white" />
          </div>
        </div>

        {/* حقل اسم المستخدم */}
        <Input
          label="اسم المستخدم"
          placeholder="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            setError('')
          }}
          error={error}
          iconLeft={<AtSign size={16} />}
          hint="أدخل اسم المستخدم بدون @"
          autoFocus
          disabled={loading}
        />

        {/* معلومة */}
        <div className="bg-ig-purple/5 rounded-lg p-3 border border-ig-purple/10">
          <p className="text-xs text-cyber-muted">
            💡 سيتم جلب بيانات الحساب تلقائياً وبدء المراقبة فور الإضافة
          </p>
        </div>

        {/* الأزرار */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="flex-1"
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
          >
            إضافة الحساب
          </Button>
        </div>
      </form>
    </Modal>
  )
}
