'use client'
// رأس الصفحة مع معلومات المستخدم وزر تسجيل الخروج
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, LogOut, User, Menu, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

interface HeaderProps {
  title?: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut({ redirect: false })
      toast.success('تم تسجيل الخروج بنجاح')
      router.push('/login')
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الخروج')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="glass border-b border-cyber-border px-4 py-3">
      <div className="flex items-center justify-between">
        {/* يسار: زر القائمة + العنوان */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-border transition-colors md:hidden"
            >
              <Menu size={18} />
            </button>
          )}
          {title && (
            <h2 className="text-base font-semibold text-cyber-text">{title}</h2>
          )}
        </div>

        {/* يمين: الإشعارات + المستخدم */}
        <div className="flex items-center gap-2">
          {/* زر التحديث */}
          <button
            onClick={() => router.refresh()}
            className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-border transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw size={16} />
          </button>

          {/* زر الإشعارات */}
          <button className="relative p-2 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-border transition-colors">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-ig-pink" />
          </button>

          {/* معلومات المستخدم */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyber-card border border-cyber-border">
            <div className="w-7 h-7 rounded-full ig-gradient flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-cyber-text leading-tight">
                {session?.user?.name || 'Admin'}
              </p>
              <p className="text-[10px] text-cyber-muted leading-tight">
                {session?.user?.role === 'ADMIN' ? 'مشرف' : 'مستخدم'}
              </p>
            </div>
          </div>

          {/* زر تسجيل الخروج */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            loading={signingOut}
            icon={<LogOut size={15} />}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
