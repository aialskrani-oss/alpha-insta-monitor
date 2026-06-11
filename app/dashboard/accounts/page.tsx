'use client'
// صفحة إدارة الحسابات
import { useEffect, useState } from 'react'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AccountCard } from '@/components/dashboard/AccountCard'
import { AddAccountModal } from '@/components/dashboard/AddAccountModal'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { CardSkeleton } from '@/components/ui/Loading'
import type { Account } from '@/types'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      const data = await res.json()
      if (data.success) setAccounts(data.data)
    } catch {
      toast.error('فشل تحميل الحسابات')
    } finally {
      setLoading(false)
    }
  }

  // مزامنة جميع الحسابات من Instagram
  const handleRefreshAll = async () => {
    if (accounts.length === 0) return
    setRefreshing(true)

    const toastId = toast.loading(`جارٍ مزامنة ${accounts.length} حساب من Instagram...`)
    let success = 0
    let failed = 0

    await Promise.allSettled(
      accounts.map(async (acc) => {
        try {
          const res = await fetch(`/api/accounts/${acc.id}/sync`, { method: 'POST' })
          const data = await res.json()
          if (data.success || data.partial) {
            if (data.data) {
              setAccounts((prev) =>
                prev.map((a) => (a.id === acc.id ? { ...a, ...data.data } : a))
              )
            }
            success++
          } else {
            failed++
          }
        } catch {
          failed++
        }
      })
    )

    toast.dismiss(toastId)
    if (failed === 0) {
      toast.success(`✅ تمت مزامنة ${success} حساب`)
    } else {
      toast.warning(`مزامنة ${success} من أصل ${accounts.length} حساب`)
    }
    setRefreshing(false)
  }

  const handleDelete = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  const handleToggle = (id: string, isTracked: boolean) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isTracked } : a))
    )
  }

  const handleUpdate = (id: string, data: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data } : a))
    )
  }

  const handleAddSuccess = (account: Account) => {
    setAccounts((prev) => [account, ...prev])
  }

  // تصفية الحسابات حسب البحث
  const filtered = accounts.filter(
    (a) =>
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      (a.fullName?.toLowerCase() || '').includes(search.toLowerCase())
  )

  const activeCount = accounts.filter((a) => a.isTracked).length

  return (
    <div className="space-y-5">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">الحسابات</h1>
          <p className="text-sm text-cyber-muted mt-0.5">
            {accounts.length} حساب · {activeCount} نشط
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshAll}
            loading={refreshing}
            icon={<RefreshCw size={15} />}
          >
            مزامنة الكل
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            icon={<Plus size={15} />}
          >
            إضافة حساب
          </Button>
        </div>
      </div>

      {/* إشعار توضيحي */}
      {accounts.length > 0 && (
        <div className="bg-ig-purple/5 border border-ig-purple/15 rounded-xl px-4 py-3 text-xs text-cyber-muted flex items-center gap-2">
          <RefreshCw size={12} className="shrink-0 text-ig-purple" />
          <span>اضغط أيقونة ↺ على أي حساب لجلب أحدث البيانات من Instagram مباشرة</span>
        </div>
      )}

      {/* شريط البحث */}
      {accounts.length > 0 && (
        <Input
          placeholder="ابحث باسم المستخدم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search size={15} />}
          className="max-w-sm"
        />
      )}

      {/* شبكة الحسابات */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CardSkeleton count={6} />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState onAddAccount={() => setShowAddModal(true)} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search size={32} className="text-cyber-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm text-cyber-muted">لا توجد نتائج لـ &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onDelete={handleDelete}
              onToggleTracking={handleToggle}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      {/* نافذة إضافة حساب */}
      <AddAccountModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  )
}
