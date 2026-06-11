'use client'
  // صفحة الإعدادات الكاملة مع دليل الإعداد
  import { useEffect, useState } from 'react'
  import { toast } from 'sonner'
  import { Save, Send, Bell, Bot, Clock, Key, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react'
  import { Card, CardHeader } from '@/components/ui/Card'
  import { Button } from '@/components/ui/Button'
  import { Input } from '@/components/ui/Input'
  import type { Settings } from '@/types'

  export default function SettingsPage() {
    const [settings, setSettings] = useState<Partial<Settings>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testingTelegram, setTestingTelegram] = useState(false)
    const [showBotToken, setShowBotToken] = useState(false)
    const [showApifyToken, setShowApifyToken] = useState(false)
    const [apifyStatus, setApifyStatus] = useState<'unknown'|'ok'|'error'>('unknown')
    const [telegramStatus, setTelegramStatus] = useState<'unknown'|'ok'|'error'>('unknown')

    useEffect(() => { fetchSettings() }, [])

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        if (data.success) {
          setSettings(data.data)
          if (data.data.apifyApiToken) setApifyStatus('ok')
          if (data.data.telegramBotToken && data.data.telegramChatId) setTelegramStatus('ok')
        }
      } catch { toast.error('فشل تحميل الإعدادات') }
      finally { setLoading(false) }
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
          toast.success('✅ تم حفظ الإعدادات')
          if (settings.apifyApiToken && !settings.apifyApiToken.startsWith('****')) setApifyStatus('ok')
          if (settings.telegramBotToken && settings.telegramChatId) setTelegramStatus('ok')
        } else toast.error(data.error || 'فشل الحفظ')
      } catch { toast.error('خطأ في الاتصال') }
      finally { setSaving(false) }
    }

    const handleTestTelegram = async () => {
      setTestingTelegram(true)
      try {
        const res = await fetch('/api/settings', { method: 'POST' })
        const data = await res.json()
        if (data.success) { toast.success('تم الإرسال بنجاح! 🎉'); setTelegramStatus('ok') }
        else { toast.error(data.error || 'فشل الاختبار'); setTelegramStatus('error') }
      } catch { toast.error('خطأ') }
      finally { setTestingTelegram(false) }
    }

    if (loading) return (
      <div className="space-y-5">
        {[1,2,3].map(i => <div key={i} className="glass rounded-xl p-5 animate-pulse h-48" />)}
      </div>
    )

    const isFullySetup = apifyStatus === 'ok' && telegramStatus === 'ok'

    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">الإعدادات</h1>
          <p className="text-sm text-cyber-muted mt-0.5">إعداد المراقبة الأوتوماتيكية وإشعارات تيليجرام</p>
        </div>

        {/* بطاقة الحالة */}
        <div className={`rounded-xl border p-4 ${isFullySetup ? 'bg-green-400/5 border-green-400/20' : 'bg-ig-purple/5 border-ig-purple/20'}`}>
          <div className="flex items-start gap-3">
            {isFullySetup
              ? <CheckCircle size={20} className="text-green-400 mt-0.5 shrink-0" />
              : <AlertCircle size={20} className="text-ig-purple mt-0.5 shrink-0" />}
            <div>
              <p className="text-sm font-medium text-cyber-text">
                {isFullySetup ? '✅ النظام جاهز — المراقبة كل 30 دقيقة تلقائياً' : '⚙️ أكمل الإعداد لتفعيل المراقبة الأوتوماتيكية'}
              </p>
              <p className="text-xs text-cyber-muted mt-1">
                {isFullySetup ? 'ستصلك إشعارات فورية على تيليجرام عند أي تغيير' : 'أضف Apify Token + بوت تيليجرام'}
              </p>
            </div>
          </div>
        </div>

        {/* إعداد Apify */}
        <Card>
          <CardHeader title="Apify API — جلب بيانات Instagram" subtitle="مجاني جزئياً — يكفي لمراقبة 10+ حسابات شهرياً" icon={<Key size={16} />} />
          <div className="space-y-4">
            <div className="bg-cyber-card rounded-xl border border-cyber-border p-4 space-y-3">
              <p className="text-xs font-medium text-ig-purple">📋 إنشاء حساب Apify مجاني (دقيقتين):</p>
              {[
                { n: 1, text: 'اذهب إلى apify.com وأنشئ حساباً مجانياً (بدون بطاقة بنكية)' },
                { n: 2, text: 'بعد تسجيل الدخول: Settings → API & Integrations' },
                { n: 3, text: 'انسخ الـ Personal API Token وضعه أدناه' },
              ].map(({ n, text }) => (
                <div key={n} className="flex gap-3 text-xs text-cyber-muted">
                  <span className="w-5 h-5 rounded-full bg-ig-purple/20 text-ig-purple flex items-center justify-center text-[10px] font-bold shrink-0">{n}</span>
                  <span>{text}</span>
                </div>
              ))}
              <a href="https://apify.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-ig-purple hover:text-ig-pink transition-colors">
                <ExternalLink size={12} /> فتح Apify.com
              </a>
            </div>
            <div className="relative">
              <Input
                label="Apify API Token"
                type={showApifyToken ? 'text' : 'password'}
                placeholder="apify_api_xxxxxxxxxxxxx"
                value={settings.apifyApiToken || ''}
                onChange={e => setSettings(s => ({ ...s, apifyApiToken: e.target.value }))}
                hint="Personal API Token من إعدادات Apify"
              />
              <button onClick={() => setShowApifyToken(!showApifyToken)} className="absolute left-3 top-9 text-cyber-muted hover:text-cyber-text">
                {showApifyToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {apifyStatus === 'ok' && <div className="flex items-center gap-2 text-xs text-green-400"><CheckCircle size={13} /> Apify مرتبط ✓</div>}
          </div>
        </Card>

        {/* إعداد تيليجرام */}
        <Card>
          <CardHeader title="بوت تيليجرام — الإشعارات الفورية" subtitle="استقبل المنشورات والستوريز مباشرة على تيليجرام" icon={<Bot size={16} />} />
          <div className="space-y-4">
            <div className="bg-cyber-card rounded-xl border border-cyber-border p-4 space-y-3">
              <p className="text-xs font-medium text-ig-purple">📋 إنشاء بوت تيليجرام:</p>
              {[
                { n: 1, text: 'افتح تيليجرام → ابحث عن @BotFather → /newbot' },
                { n: 2, text: 'اختر اسماً للبوت واحصل على التوكن' },
                { n: 3, text: 'للـ Chat ID: ابحث عن @userinfobot وأرسل أي رسالة' },
                { n: 4, text: 'أرسل رسالة لبوتك أولاً حتى يتمكن من إرسال إشعارات لك' },
              ].map(({ n, text }) => (
                <div key={n} className="flex gap-3 text-xs text-cyber-muted">
                  <span className="w-5 h-5 rounded-full bg-ig-purple/20 text-ig-purple flex items-center justify-center text-[10px] font-bold shrink-0">{n}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className="relative">
              <Input
                label="توكن البوت"
                type={showBotToken ? 'text' : 'password'}
                placeholder="123456789:AABBccDDee..."
                value={settings.telegramBotToken || ''}
                onChange={e => setSettings(s => ({ ...s, telegramBotToken: e.target.value }))}
              />
              <button onClick={() => setShowBotToken(!showBotToken)} className="absolute left-3 top-9 text-cyber-muted hover:text-cyber-text">
                {showBotToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Input
              label="Chat ID"
              placeholder="123456789 أو -100xxxxxxxxx"
              value={settings.telegramChatId || ''}
              onChange={e => setSettings(s => ({ ...s, telegramChatId: e.target.value }))}
              hint="من @userinfobot على تيليجرام"
            />
            <Button variant="secondary" onClick={handleTestTelegram} loading={testingTelegram} icon={<Send size={14} />}>
              إرسال رسالة اختبار
            </Button>
            {telegramStatus === 'ok' && <div className="flex items-center gap-2 text-xs text-green-400"><CheckCircle size={13} /> تيليجرام مرتبط ✓</div>}
            {telegramStatus === 'error' && <div className="flex items-center gap-2 text-xs text-red-400"><AlertCircle size={13} /> تحقق من التوكن والـ Chat ID</div>}
          </div>
        </Card>

        {/* أنواع الإشعارات */}
        <Card>
          <CardHeader title="أنواع الإشعارات" subtitle="اختر ما تريد أن تُنبَّه به" icon={<Bell size={16} />} />
          <div className="space-y-2">
            {[
              { key: 'notifyOnFollow', label: 'متابعون جدد', emoji: '📈', desc: 'مع صورة الملف الشخصي' },
              { key: 'notifyOnUnfollow', label: 'فقدان متابعين', emoji: '📉', desc: 'إشعار فوري' },
              { key: 'notifyOnNewPost', label: 'منشور/فيديو جديد', emoji: '📸', desc: 'مع إرسال الصورة أو الفيديو' },
              { key: 'notifyOnNewStory', label: 'ستوري جديدة', emoji: '🔴', desc: 'مع محتوى الستوري' },
              { key: 'notifyOnBioChange', label: 'تغيير السيرة الذاتية', emoji: '✏️', desc: 'قبل وبعد التغيير' },
            ].map(({ key, label, emoji, desc }) => (
              <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-cyber-card border border-cyber-border cursor-pointer hover:border-ig-purple/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span>{emoji}</span>
                  <div>
                    <p className="text-sm text-cyber-text">{label}</p>
                    <p className="text-xs text-cyber-muted">{desc}</p>
                  </div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only"
                    checked={settings[key as keyof Settings] as boolean || false}
                    onChange={e => setSettings(s => ({ ...s, [key]: e.target.checked }))}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${settings[key as keyof Settings] ? 'bg-ig-purple' : 'bg-cyber-border'}`}>
                    <div className={`absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings[key as keyof Settings] ? '-translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* فترة المراقبة */}
        <Card>
          <CardHeader title="فترة المراقبة التلقائية" subtitle="كم مرة يفحص النظام الحسابات" icon={<Clock size={16} />} />
          <div className="grid grid-cols-4 gap-2">
            {[{ mins: 30, label: '30 دقيقة' }, { mins: 60, label: 'ساعة' }, { mins: 120, label: 'ساعتين' }, { mins: 360, label: '6 ساعات' }].map(({ mins, label }) => (
              <button key={mins} onClick={() => setSettings(s => ({ ...s, checkIntervalMins: mins }))}
                className={`py-3 rounded-xl text-sm font-medium border transition-all ${settings.checkIntervalMins === mins ? 'bg-ig-purple/15 border-ig-purple/40 text-ig-pink' : 'border-cyber-border text-cyber-muted hover:border-ig-purple/30'}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-cyber-muted mt-3">⚡ كل 30 دقيقة = ~90 طلب Apify شهرياً لكل حساب (الخطة المجانية: 5$ رصيد)</p>
        </Card>

        <Button onClick={handleSave} loading={saving} size="lg" icon={<Save size={16} />} fullWidth>
          حفظ جميع الإعدادات
        </Button>
      </div>
    )
  }