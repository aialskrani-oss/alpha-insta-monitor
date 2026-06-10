'use client'
// قائمة الجوال المنزلقة
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { X, LayoutDashboard, Users, Settings, BarChart2, Share2, Instagram } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
  { href: '/dashboard/accounts', label: 'الحسابات', icon: <Users size={18} /> },
  { href: '/dashboard/analytics', label: 'الإحصائيات', icon: <BarChart2 size={18} /> },
  { href: '/dashboard/referrals', label: 'الإحالات', icon: <Share2 size={18} /> },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: <Settings size={18} /> },
]

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* خلفية */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* القائمة */}
      <div className="absolute right-0 top-0 bottom-0 w-72 glass border-l border-cyber-border animate-slide-in">
        {/* رأس القائمة */}
        <div className="flex items-center justify-between p-4 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl ig-gradient flex items-center justify-center">
              <Instagram size={16} className="text-white" />
            </div>
            <span className="font-bold ig-gradient-text text-sm">Alpha Monitor</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-border"
          >
            <X size={18} />
          </button>
        </div>

        {/* روابط التنقل */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                isActive(item.href)
                  ? 'bg-ig-purple/15 text-ig-pink border border-ig-purple/20'
                  : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border'
              )}
            >
              <span className={isActive(item.href) ? 'text-ig-purple' : ''}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
