// Middleware لحماية المسارات - يتحقق من الجلسة
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // إذا كان المستخدم مسجلاً ويحاول الوصول لصفحة تسجيل الدخول
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // السماح بهذه المسارات دون مصادقة
        if (pathname === '/login') return true
        if (pathname.startsWith('/api/auth')) return true
        if (pathname.startsWith('/api/setup')) return true
        if (pathname.startsWith('/api/db-check')) return true

        // باقي الصفحات تتطلب توكن صالح
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
}
