'use client'
  // صفحة الإعدادات الكاملة مع دليل الإعداد خطوة بخطوة
  import { useEffect, useState } from 'react'
  import { toast } from 'sonner'
  import { Save, Send, Bell, Bot, Clock, Key, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff, RefreshCw } from 'lucide-react'

  interface Settings {
    id?: string
    telegramBotToken?: string | null
    telegramChatId?: string | null
    apifyApiToken?: string | null
    notifyOnFollow?: boolean
    notifyOnUnfollow?: boolean
    notifyOnNewPost?: boolean
    notifyOnNewStory?: boolean
    notifyOnBioChange?: boolean
    checkIntervalMins?: number
  }

  export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testingTelegram, setTestingTelegram] = useState(false)
    const [showBotToken, setShowBotToken] = useState(false)
    const [showApifyToken, setShowApifyToken] = useState(false)
    const [apifyStatus, setApifyStatus] = useState<'unknown'|'ok'|'error'>('unknown')
    const [telegramStatus, setTelegramStatus] = useState<'unknown'|'ok'|'error'>('unknown')
    const [cronUrl, setCronUrl] = useState('')

    useEffect(() => {
      fetchSettings()
      // بناء URL الـ Cron
      if (typeof window !== 'undefined') {
        setCronUrl(window.location.origin + '/api/cron/monitor')
      }
    }, [])

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
        else { toast.error(data.error || 'فشل'); setTelegramStatus('error') }
      } catch { toast.error('خطأ') }
      finally { setTestingTelegram(false) }
    }

    const handleManualSync = async () => {
      try {
        const cronSecret = prompt('أدخل CRON_SECRET (من Vercel Environment Variables):')
        if (!cronSecret) return
        const res = await fetch('/api/cron/monitor', {
          headers: { Authorization: 'Bearer ' + cronSecret }
        })
        const data = await res.json()
        if (data.success) toast.success('✅ تمت المزامنة — ' + data.processed + ' حساب')
        else toast.error(data.error || data.message || 'خطأ')
      } catch { toast.error('خطأ في المزامنة') }
    }

    if (loading) return (
      <div className="space-y-5 max-w-2xl">
        {[1,2,3].map(i => <div key={i} className="bg-cyber-card border border-cyber-border rounded-2xl p-6 animate-pulse h-48" />)}
      </div>
    )

    const isFullySetup = apifyStatus === 'ok' && telegramStatus === 'ok'

    return (
      <div className="space-y-5 max-w-2xl" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
          <p className="text-sm text-gray-400 mt-0.5">إعداد المراقبة الأوتوماتيكية وإشعارات تيليجرام</p>
        </div>

        {/* حالة النظام */}
        <div className={`rounded-2xl border p-4 ${isFullySetup ? 'bg-green-500/5 border-green-500/20' : 'bg-purple-500/5 border-purple-500/20'}`}>
          <div className="flex items-start gap-3">
            {isFullySetup
              ? <CheckCircle size={20} className="text-green-400 mt-0.5 shrink-0" />
              : <AlertCircle size={20} className="text-purple-400 mt-0.5 shrink-0" />}
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {isFullySetup ? '✅ النظام جاهز للمراقبة التلقائية' : '⚙️ أكمل الإعداد لتفعيل المراقبة الأوتوماتيكية'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isFullySetup
                  ? 'أضف رابط Cron أدناه على cron-job.org لتشغيل تلقائي كل 30 دقيقة'
                  : 'ستحتاج: Apify API Token + بوت تيليجرام'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── بطاقة Apify ─────────────────────────────────────────────── */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-cyber-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Key size={16} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Apify API — جلب بيانات Instagram</h3>
                <p className="text-xs text-gray-400">مجاني جزئياً — 5$ رصيد مجاني = 10+ حسابات شهرياً</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-purple-400">📋 خطوات الحصول على Apify Token:</p>
              {[
                'اذهب إلى apify.com وأنشئ حساباً مجانياً (لا تحتاج بطاقة بنك)',
                'بعد تسجيل الدخول: Settings ← API & Integrations',
                'انسخ الـ "Personal API Token" وضعه أدناه',
              ].map((text, i) => (
                <div key={i} className="flex gap-3 text-xs text-gray-400">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                  <span>{text}</span>
                </div>
              ))}
              <a href="https://apify.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-pink-400 transition-colors mt-1">
                <ExternalLink size={11} /> فتح Apify.com
              </a>
            </div>

            <div className="relative">
              <label className="block text-xs text-gray-400 mb-1.5">Apify API Token</label>
              <input
                type={showApifyToken ? 'text' : 'password'}
                placeholder="apify_api_xxxxxxxxxxxxx"
                value={settings.apifyApiToken || ''}
                onChange={e => setSettings(s => ({ ...s, apifyApiToken: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors pl-10"
              />
              <button onClick={() => setShowApifyToken(!showApifyToken)} className="absolute left-3 bottom-3 text-gray-500 hover:text-gray-300">
                {showApifyToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {apifyStatus === 'ok' && <p className="flex items-center gap-2 text-xs text-green-400"><CheckCircle size={13} /> تم ربط Apify بنجاح</p>}
          </div>
        </div>

        {/* ─── بطاقة تيليجرام ──────────────────────────────────────────── */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-cyber-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Bot size={16} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">بوت تيليجرام — الإشعارات الفورية</h3>
                <p className="text-xs text-gray-400">منشورات وستوريز وصور مباشرة على تيليجرام</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-blue-400">📋 إنشاء بوت تيليجرام (دقيقتان فقط):</p>
              {[
                'تيليجرام ← ابحث عن @BotFather ← أرسل /newbot',
                'اختر اسماً للبوت وانسخ التوكن',
                'للـ Chat ID: ابحث عن @userinfobot وأرسل له أي رسالة',
                'أرسل /start لبوتك حتى يتمكن من إرسال إشعارات لك',
              ].map((text, i) => (
                <div key={i} className="flex gap-3 text-xs text-gray-400">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="relative mb-3">
                <label className="block text-xs text-gray-400 mb-1.5">توكن البوت</label>
                <input
                  type={showBotToken ? 'text' : 'password'}
                  placeholder="123456789:AABBccDDeeFFggHH..."
                  value={settings.telegramBotToken || ''}
                  onChange={e => setSettings(s => ({ ...s, telegramBotToken: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors pl-10"
                />
                <button onClick={() => setShowBotToken(!showBotToken)} className="absolute left-3 bottom-3 text-gray-500 hover:text-gray-300">
                  {showBotToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Chat ID</label>
                <input
                  placeholder="123456789 أو -100xxxxxxxxx للمجموعات"
                  value={settings.telegramChatId || ''}
                  onChange={e => setSettings(s => ({ ...s, telegramChatId: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">احصل عليه من @userinfobot على تيليجرام</p>
              </div>
            </div>

            <button onClick={handleTestTelegram} disabled={testingTelegram}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-300 hover:border-blue-500/50 hover:text-white transition-colors disabled:opacity-50">
              <Send size={14} className={testingTelegram ? 'animate-pulse' : ''} />
              {testingTelegram ? 'جاري الإرسال...' : 'إرسال رسالة اختبار'}
            </button>

            {telegramStatus === 'ok' && <p className="flex items-center gap-2 text-xs text-green-400"><CheckCircle size={13} /> تيليجرام مرتبط — الإشعارات جاهزة ✓</p>}
            {telegramStatus === 'error' && <p className="flex items-center gap-2 text-xs text-red-400"><AlertCircle size={13} /> تحقق من التوكن والـ Chat ID</p>}
          </div>
        </div>

        {/* ─── بطاقة Cron التلقائي ─────────────────────────────────────── */}
        {isFullySetup && (
          <div className="bg-cyber-card border border-green-500/20 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-green-500/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Clock size={16} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">المراقبة التلقائية كل 30 دقيقة</h3>
                  <p className="text-xs text-gray-400">أضف رابط Cron على cron-job.org (مجاني 100%)</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 space-y-2.5">
                <p className="text-xs font-semibold text-green-400">🔄 إعداد cron-job.org (مجاني):</p>
                {[
                  'اذهب إلى cron-job.org وأنشئ حساباً مجانياً',
                  'اضغط "Create cronjob" وضع الرابط أدناه',
                  'في Headers: أضف Authorization: Bearer YOUR_CRON_SECRET',
                  'اضبط الجدول على "كل 30 دقيقة" واحفظ',
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 text-xs text-gray-400">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">رابط الـ Cron (انسخه)</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={cronUrl}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-green-400 font-mono select-all"
                  />
                  <button onClick={() => { navigator.clipboard.writeText(cronUrl); toast.success('تم النسخ!') }}
                    className="px-3 py-2.5 rounded-xl border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-green-500/50 transition-colors">
                    نسخ
                  </button>
                </div>
              </div>
              <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors">
                <ExternalLink size={11} /> فتح cron-job.org
              </a>
            </div>
          </div>
        )}

        {/* ─── أنواع الإشعارات ─────────────────────────────────────────── */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-cyber-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Bell size={16} className="text-pink-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">أنواع الإشعارات</h3>
                <p className="text-xs text-gray-400">اختر ما تريد أن تُنبَّه به</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-1.5">
            {[
              { key: 'notifyOnFollow', label: 'متابعون جدد', emoji: '📈', desc: 'مع صورة الملف الشخصي' },
              { key: 'notifyOnUnfollow', label: 'فقدان متابعين', emoji: '📉', desc: 'إشعار فوري بالتغيير' },
              { key: 'notifyOnNewPost', label: 'منشور أو فيديو جديد', emoji: '📸', desc: 'مع إرسال الصورة أو الفيديو' },
              { key: 'notifyOnNewStory', label: 'ستوري جديدة', emoji: '🔴', desc: 'مع محتوى الستوري' },
              { key: 'notifyOnBioChange', label: 'تغيير السيرة الذاتية', emoji: '✏️', desc: 'النص القديم والجديد' },
            ].map(({ key, label, emoji, desc }) => (
              <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-800 cursor-pointer hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{emoji}</span>
                  <div>
                    <p className="text-sm text-white">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" className="sr-only"
                    checked={settings[key as keyof Settings] as boolean ?? false}
                    onChange={e => setSettings(s => ({ ...s, [key]: e.target.checked }))}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${settings[key as keyof Settings] ? 'bg-purple-500' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings[key as keyof Settings] ? 'right-0.5 translate-x-0' : 'left-0.5'}`} />
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ─── زر الحفظ ────────────────────────────────────────────────── */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
          <Save size={16} className={saving ? 'animate-spin' : ''} />
          {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
        </button>
      </div>
    )
  }