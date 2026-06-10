'use client'
// نموذج تسجيل الدخول مع تصميم احترافي بألوان إنستغرام
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    if (!form.email) newErrors.email = 'البريد الإلكتروني مطلوب'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'بريد إلكتروني غير صالح'
    if (!form.password) newErrors.password = 'كلمة المرور مطلوبة'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('بريد إلكتروني أو كلمة مرور غير صحيحة')
      } else {
        toast.success('مرحباً بك! جارٍ التوجيه...')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('حدث خطأ، حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4">
      {/* خلفية متحركة */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-ig-purple/10 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-ig-pink/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-ig-orange/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-enter">
        {/* بطاقة تسجيل الدخول */}
        <div className="glass rounded-2xl p-8 border border-cyber-border shadow-card">

          {/* الشعار */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl ig-gradient flex items-center justify-center shadow-ig">
                <Instagram className="text-white" size={28} />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-cyber-bg" />
            </div>
            <h1 className="text-2xl font-bold ig-gradient-text">
              Alpha Insta Monitor
            </h1>
            <p className="text-cyber-muted text-sm mt-1">
              تسجيل الدخول للوحة التحكم
            </p>
          </div>

          {/* النموذج */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              error={errors.email}
              iconLeft={<Mail size={16} />}
              autoComplete="email"
              disabled={loading}
            />

            <Input
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
              error={errors.password}
              iconLeft={<Lock size={16} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="current-password"
              disabled={loading}
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
            </Button>
          </form>

          {/* تذييل */}
          <div className="mt-6 pt-5 border-t border-cyber-border">
            <p className="text-center text-xs text-cyber-muted">
              محمي بـ{' '}
              <span className="ig-gradient-text font-semibold">Alpha Monitor</span>
              {' '}— وصول محظور على غير المصرح لهم
            </p>
          </div>
        </div>

        {/* خط تدرج أسفل البطاقة */}
        <div className="h-1 w-3/4 mx-auto rounded-full ig-gradient opacity-50 mt-2" />
      </div>
    </div>
  )
}
