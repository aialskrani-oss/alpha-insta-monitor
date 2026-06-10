'use client'
// صفحة الإعدادات - تيليجرام، الويبهوك، الإشعارات
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Send, Bell, Webhook, Bot, Clock } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Settings } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingTelegram, setTestingTelegram] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.success) setSettings(data.data)
    } catch {
      toast.error('فشل تحميل الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حفظ الإعدادات بنجاح ✅')
      } else {
        toast.error(data.error || 'فشل حفظ الإعدادات')
      }
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    setTestingTelegram(true)
    try {
      const res = await fetch('/api/settings', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('تم إرسال اختبار تيليجرام بنجاح! 🎉')
      } else {
        toast.error(data.error || 'فشل الاختبار')
      }
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setTestingTelegram(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-5 animate-pulse h-48" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* رأس الصفحة */}
      <div>
        <h1 className="text-2xl font-bold text-cyber-text">الإعدادات</h1>
        <p className="text-sm text-cyber-muted mt-0.5">
          إعداد إشعارات تيليجرام والويبهوك
        </p>
      </div>

      {/* إعدادات تيليجرام */}
      <Card>
        <CardHeader
          title="بوت تيليجرام"
          subtitle="إشعارات فورية عبر تيليجرام"
          icon={<Bot size={16} />}
        />
        <div className="space-y-4">
          <Input
            label="توكن البوت"
            type="password"
            placeholder="123456789:AABBcc..."
            value={settings.telegramBotToken || ''}
            onChange={(e) => setSettings(s => ({ ...s, telegramBotToken: e.target.value }))}
            hint="احصل عليه من @BotFather على تيليجرام"
          />
          <Input
            label="معرف المحادثة (Chat ID)"
            placeholder="-100123456789 أو 123456789"
            value={settings.telegramChatId || ''}
            onChange={(e) => setSettings(s => ({ ...s, telegramChatId: e.target.value }))}
            hint="يمكن أن يكون معرف مستخدم أو مجموعة أو قناة"
          />
          <Button
            variant="secondary"
            onClick={handleTestTelegram}
            loading={testingTelegram}
            icon={<Send size={14} />}
          >
            اختبار الإشعار
          </Button>
        </div>
      </Card>

      {/* إعدادات الويبهوك */}
      <Card>
        <CardHeader
          title="الويبهوك (Webhook)"
          subtitle="إرسال الأحداث إلى URL خارجي"
          icon={<Webhook size={16} />}
        />
        <div className="space-y-4">
          <Input
            label="رابط الويبهوك"
            type="url"
            placeholder="https://your-server.com/webhook"
            value={settings.webhookUrl || ''}
            onChange={(e) => setSettings(s => ({ ...s, webhookUrl: e.target.value }))}
          />
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={settings.webhookEnabled || false}
                onChange={(e) => setSettings(s => ({ ...s, webhookEnabled: e.target.checked }))}
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${settings.webhookEnabled ? 'bg-ig-purple' : 'bg-cyber-border'}`}>
                <div className={`absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.webhookEnabled ? '-translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
            <span className="text-sm text-cyber-text">تفعيل الويبهوك</span>
          </label>
        </div>
      </Card>

      {/* إعدادات الإشعارات */}
      <Card>
        <CardHeader
          title="الإشعارات"
          subtitle="اختر أنواع الأحداث التي تريد الإشعار بها"
          icon={<Bell size={16} />}
        />
        <div className="space-y-3">
          {[
            { key: 'notifyOnFollow', label: 'عند اكتساب متابعين جدد', emoji: '📈' },
            { key: 'notifyOnUnfollow', label: 'عند فقدان متابعين', emoji: '📉' },
            { key: 'notifyOnNewPost', label: 'عند نشر منشور جديد', emoji: '📸' },
          ].map(({ key, label, emoji }) => (
            <label key={key} className="flex items-center justify-between p-3 rounded-lg bg-cyber-card border border-cyber-border cursor-pointer hover:border-ig-purple/30 transition-colors">
              <span className="text-sm text-cyber-text">{emoji} {label}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings[key as keyof Settings] as boolean || false}
                  onChange={(e) => setSettings(s => ({ ...s, [key]: e.target.checked }))}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${settings[key as keyof Settings] ? 'bg-ig-purple' : 'bg-cyber-border'}`}>
                  <div className={`absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings[key as keyof Settings] ? '-translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* فترة الفحص */}
      <Card>
        <CardHeader
          title="فترة الفحص"
          subtitle="كم مرة يتم فحص الحسابات"
          icon={<Clock size={16} />}
        />
        <div className="flex items-center gap-4">
          {[30, 60, 120, 360].map((mins) => (
            <button
              key={mins}
              onClick={() => setSettings(s => ({ ...s, checkIntervalMins: mins }))}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                settings.checkIntervalMins === mins
                  ? 'bg-ig-purple/15 border-ig-purple/40 text-ig-pink'
                  : 'border-cyber-border text-cyber-muted hover:border-ig-purple/30'
              }`}
            >
              {mins < 60 ? `${mins}د` : `${mins / 60}س`}
            </button>
          ))}
        </div>
      </Card>

      {/* زر الحفظ */}
      <Button
        onClick={handleSave}
        loading={saving}
        size="lg"
        icon={<Save size={16} />}
        fullWidth
      >
        حفظ الإعدادات
      </Button>
    </div>
  )
}
