'use client'
// الشريط الجانبي للوحة التحكم
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart2,
  Share2,
  Instagram,
  ChevronLeft,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
  { href: '/dashboard/accounts', label: 'الحسابات', icon: <Users size={18} /> },
  { href: '/dashboard/analytics', label: 'الإحصائيات', icon: <BarChart2 size={18} /> },
  { href: '/dashboard/referrals', label: 'الإحالات', icon: <Share2 size={18} /> },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: <Settings size={18} /> },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full glass border-l border-cyber-border',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* الشعار */}
      <div className="flex items-center gap-3 p-4 border-b border-cyber-border">
        <div className="w-9 h-9 rounded-xl ig-gradient flex items-center justify-center shrink-0 shadow-ig">
          <Instagram size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold ig-gradient-text truncate">
              Alpha Monitor
            </p>
            <p className="text-xs text-cyber-muted truncate">لوحة التحكم</p>
          </div>
        )}
        {onToggle && !collapsed && (
          <button
            onClick={onToggle}
            className="mr-auto p-1 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-border transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* روابط التنقل */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
              'transition-all duration-200',
              isActive(item.href)
                ? 'bg-ig-purple/15 text-ig-pink border border-ig-purple/20 shadow-glow'
                : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border'
            )}
          >
            <span
              className={cn(
                'shrink-0 transition-colors',
                isActive(item.href) ? 'text-ig-purple' : ''
              )}
            >
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-ig-pink text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* إصدار المشروع */}
      {!collapsed && (
        <div className="p-4 border-t border-cyber-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-cyber-muted">v1.0 — نشط</span>
          </div>
        </div>
      )}
    </aside>
  )
}
