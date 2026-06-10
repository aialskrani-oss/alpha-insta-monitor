// تخطيط التطبيق الرئيسي مع دعم RTL والدارك مود
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { SessionProvider } from '@/components/auth/SessionProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Alpha Insta Monitor',
  description: 'لوحة تحكم احترافية لمراقبة حسابات إنستغرام',
  keywords: 'instagram, monitor, analytics, social media',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-cyber-bg text-cyber-text antialiased">
        <SessionProvider>
          {children}
          {/* نظام الإشعارات */}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#111118',
                border: '1px solid rgba(131, 58, 180, 0.3)',
                color: '#e2e8f0',
                fontFamily: 'Inter, sans-serif',
                direction: 'rtl',
              },
              className: 'rtl',
            }}
            richColors
          />
        </SessionProvider>
      </body>
    </html>
  )
}
