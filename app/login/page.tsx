// صفحة تسجيل الدخول
import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تسجيل الدخول — Alpha Insta Monitor',
}

export default function LoginPage() {
  return <LoginForm />
}
