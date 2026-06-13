'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Save, Send, Bell, Bot, Clock, Key, CheckCircle, AlertCircle,
  ExternalLink, Eye, EyeOff, RefreshCw, Copy, Users, Zap,
} from 'lucide-react'

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
  notifyOnPrivate?: boolean
  checkIntervalMins?: number
}

export default function SettingsPage() {
  const [settings,         setSettings]         = useState<Settings>({})
  const [loading,          setLoading]          = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [testingTelegram,  setTestingTelegram]  = useState(false)
  const [showBotToken,     setShowBotToken]     = useState(false)
  const [showApifyToken,   setShowApifyToken]   = useState(false)
  const [apifyStatus,      setApifyStatus]      = useState<'unknown'|'ok'|'error'>('unknown')
  const [telegramStatus,   setTelegramStatus]   = useState<'unknown'|'ok'|'error'>('unknown')
  const [cronUrl,          setCronUrl]          = useState('')
  const [copiedCron,       setCopiedCron]       = useState(false)

  useEffect(() => {
    fetchSettings()
    if (typeof window !== 'undefined') setCronUrl(window.location.origin + '/api/cron/monitor')
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
        if (settings.apifyApiToken) setApifyStatus('ok')
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
      if (data.success) { toast.success('✅ وصلت رسالة الاختبار لتيليجرام!'); setTelegramStatus('ok') }
      else { toast.error(data.error || 'فشل — تحقق من التوكن والـ Chat ID'); setTelegramStatus('error') }
    } catch { toast.error('خطأ في الاتصال') }
    finally { setTestingTelegram(false) }
  }

  const copyCronUrl = () => {
    navigator.clipboard.writeText(cronUrl)
    setCopiedCron(true)
    toast.success('✅ تم نسخ رابط Cron')
    setTimeout(() => setCopiedCron(false), 2000)
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
        <p className="text-sm text-gray-400 mt-0.5">إعداد المراقبة التلقائية وإشعارات تيليجرام</p>
      </div>

      {/* حالة النظام */}
      <div className={`rounded-2xl border p-4 ${isFullySetup ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
        <div className="flex items-start gap-3">
          {isFullySetup
            ? <CheckCircle size={20} className="text-green-400 mt-0.5 shrink-0" />
            : <AlertCircle size={20} className="text-yellow-400 mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {isFullySetup ? '✅ النظام جاهز للمراقبة التلقائية' : '⚙️ أكمل الإعداد لتفعيل المراقبة'}
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              {[
                { label: 'Apify', done: apifyStatus === 'ok' },
                { label: 'تيليجرام', done: telegramStatus === 'ok' },
                { label: 'Cron', done: isFullySetup },
              ].map(s => (
                <span key={s.label} className={`flex items-center gap-1 text-xs ${s.done ? 'text-green-400' : 'text-gray-500'}`}>
                  {s.done ? <CheckCircle size={11} /> : <AlertCircle size={11} />} {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── بطاقة Apify ─────────────────────────────────────────────────── */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-cyber-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Key size={16} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Apify API — جلب بيانات Instagram</h3>
            <p className="text-xs text-gray-400">$5 رصيد مجاني عند التسجيل = يكفي لعشرات الحسابات شهرياً</p>
          </div>
          {apifyStatus === 'ok' && <CheckCircle size={16} className="text-green-400 shrink-0" />}
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-purple-400">📋 خطوات الحصول على Apify Token:</p>
            {[
              { step: '1', text: 'اذهب إلى apify.com وأنشئ حساباً مجانياً (لا تحتاج بطاقة)', link: 'https://apify.com/sign-up' },
              { step: '2', text: 'بعد الدخول: اضغط صورتك الشخصية ← Settings ← API & Integrations' },
              { step: '3', text: 'انسخ "Personal API Token" (يبدأ بـ apify_api_) وضعه أدناه' },
            ].map(({ step, text, link }) => (
              <div key={step} className="flex gap-3 text-xs text-gray-400 items-start">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{step}</span>
                <span className="flex-1">{text} {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">فتح ↗</a>}</span>
              </div>
            ))}
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
          {apifyStatus === 'ok' && <p className="flex items-center gap-2 text-xs text-green-400"><CheckCircle size={13} /> Apify مرتبط ✓</p>}
        </div>
      </div>

      {/* ─── بطاقة تيليجرام ──────────────────────────────────────────────── */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-cyber-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Bot size={16} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">بوت تيليجرام — إشعارات فورية</h3>
            <p className="text-xs text-gray-400">منشورات، ستوريات، صور، وفيديوهات مباشرة في تيليجرام</p>
          </div>
          {telegramStatus === 'ok' && <CheckCircle size={16} className="text-green-400 shrink-0" />}
        </div>
        <div className="p-5 space-y-4">
          {/* خطوات إنشاء البوت */}
          <div className="bg-blue-950/30 rounded-xl border border-blue-500/20 p-4 space-y-3">
            <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Bot size={12} /> كيف تنشئ بوت تيليجرام؟ (5 دقائق فقط)
            </p>
            {[
              {
                step: '1',
                title: 'أنشئ البوت',
                desc: 'افتح تيليجرام وابحث عن @BotFather وأرسل له: /newbot',
                sub: 'اختر اسماً للبوت ثم اسم مستخدم (ينتهي بـ bot). سيرسل لك التوكن.',
              },
              {
                step: '2',
                title: 'احصل على Chat ID',
                desc: 'ابحث عن @userinfobot وأرسل له أي رسالة، سيرد بـ Chat ID الخاص بك.',
                sub: 'للمجموعات: أضف @RawDataBot للمجموعة وهو يعطيك الـ Chat ID.',
              },
              {
                step: '3',
                title: 'ابدأ المحادثة مع بوتك',
                desc: 'ابحث عن بوتك في تيليجرام واضغط Start / ابدأ حتى يتمكن من إرسال رسائل لك.',
                sub: 'مهم: بدون هذه الخطوة لن يتمكن البوت من الإرسال.',
              },
              {
                step: '4',
                title: 'أدخل البيانات أدناه واضغط "إرسال اختبار"',
                desc: 'يجب أن تصل رسالة لتيليجرام خلال ثوان.',
                sub: '',
              },
            ].map(({ step, title, desc, sub }) => (
              <div key={step} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{step}</span>
                <div>
                  <p className="text-xs text-white font-medium">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <label className="block text-xs text-gray-400 mb-1.5">توكن البوت (Bot Token)</label>
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
              <label className="block text-xs text-gray-400 mb-1.5">Chat ID (معرّف المحادثة)</label>
              <input
                placeholder="123456789 أو -100xxxxxxxxx للمجموعات"
                value={settings.telegramChatId || ''}
                onChange={e => setSettings(s => ({ ...s, telegramChatId: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                احصل عليه من <span className="text-blue-400">@userinfobot</span> أو <span className="text-blue-400">@RawDataBot</span> على تيليجرام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleTestTelegram} disabled={testingTelegram || !settings.telegramBotToken || !settings.telegramChatId}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-40">
              <Send size={14} className={testingTelegram ? 'animate-pulse' : ''} />
              {testingTelegram ? 'جاري الإرسال...' : 'إرسال رسالة اختبار'}
            </button>
            {telegramStatus === 'ok'    && <p className="flex items-center gap-1.5 text-xs text-green-400"><CheckCircle size={13} /> مرتبط ✓</p>}
            {telegramStatus === 'error' && <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle size={13} /> خطأ في البيانات</p>}
          </div>
        </div>
      </div>

      {/* ─── Cron التلقائي ───────────────────────────────────────────────── */}
      {isFullySetup && (
        <div className="bg-cyber-card border border-green-500/20 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-green-500/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Zap size={16} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">المراقبة التلقائية — كل 30 دقيقة</h3>
              <p className="text-xs text-gray-400">مجاني 100% عبر cron-job.org بدون فتح اللوحة</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 space-y-2.5">
              <p className="text-xs font-bold text-green-400 flex items-center gap-1.5"><Clock size={11} /> إعداد المراقبة التلقائية:</p>
              {[
                { step: '1', text: 'اذهب إلى cron-job.org وأنشئ حساباً مجانياً', link: 'https://cron-job.org/en/' },
                { step: '2', text: 'اضغط "CREATE CRONJOB" وأضف الرابط أدناه في حقل URL' },
                { step: '3', text: 'في قسم Headers: أضف Authorization: Bearer YOUR_CRON_SECRET (من Vercel Environment Variables)' },
                { step: '4', text: 'اضبط الجدول: Every 30 minutes واحفظ' },
              ].map(({ step, text, link }) => (
                <div key={step} className="flex gap-3 text-xs text-gray-400 items-start">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{step}</span>
                  <span>{text} {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-green-400 underline">فتح ↗</a>}</span>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">رابط الـ Cron Endpoint</label>
              <div className="flex gap-2">
                <input readOnly value={cronUrl}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-green-400 font-mono select-all" />
                <button onClick={copyCronUrl}
                  className={`px-3 py-2.5 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${copiedCron ? 'border-green-500/50 text-green-400' : 'border-gray-700 text-gray-400 hover:text-white hover:border-green-500/50'}`}>
                  <Copy size={12} /> {copiedCron ? 'تم!' : 'نسخ'}
                </button>
              </div>
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-xs text-yellow-400 font-medium mb-1">⚠️ مهم: CRON_SECRET</p>
              <p className="text-xs text-gray-400">في Vercel → Settings → Environment Variables، أضف متغير <code className="text-yellow-400 bg-yellow-500/10 px-1 rounded">CRON_SECRET</code> بقيمة عشوائية وقوية. ثم استخدمها في Header: <code className="text-yellow-300 bg-yellow-500/10 px-1 rounded">Authorization: Bearer [القيمة]</code></p>
            </div>
          </div>
        </div>
      )}

      {/* ─── حدود الحسابات ──────────────────────────────────────────────── */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-cyber-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Users size={16} className="text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">عدد الحسابات القابلة للمراقبة</h3>
            <p className="text-xs text-gray-400">يعتمد على رصيد Apify الخاص بك</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {[
            { tier: 'Apify مجاني ($5 رصيد)', accounts: '5–10 حسابات', sync: 'كل 30 دقيقة', color: 'text-green-400' },
            { tier: 'Apify Starter ($49/شهر)', accounts: '50–100 حساب', sync: 'كل 15 دقيقة', color: 'text-blue-400' },
            { tier: 'Apify Scale ($499/شهر)', accounts: '500+ حساب', sync: 'كل 5 دقائق', color: 'text-purple-400' },
          ].map(({ tier, accounts, sync, color }) => (
            <div key={tier} className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-800">
              <div>
                <p className={`text-xs font-medium ${color}`}>{tier}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sync}</p>
              </div>
              <span className="text-xs text-white font-semibold">{accounts}</span>
            </div>
          ))}
          <p className="text-xs text-gray-500">كل مزامنة لحساب واحد تستهلك ~$0.05 من رصيد Apify. يمكن تتبع استهلاكك في لوحة Apify.</p>
        </div>
      </div>

      {/* ─── أنواع الإشعارات ─────────────────────────────────────────────── */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-cyber-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Bell size={16} className="text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">الإشعارات الافتراضية (لجميع الحسابات)</h3>
            <p className="text-xs text-gray-400">يمكن تخصيص كل حساب بشكل مستقل من بطاقته</p>
          </div>
        </div>
        <div className="p-4 space-y-1.5">
          {[
            { key: 'notifyOnFollow',    label: 'متابعون جدد',         emoji: '📈', desc: 'مع صورة الملف الشخصي عبر تيليجرام' },
            { key: 'notifyOnUnfollow',  label: 'فقدان متابعين',       emoji: '📉', desc: 'إشعار فوري عند انخفاض العدد' },
            { key: 'notifyOnNewPost',   label: 'منشور أو فيديو جديد', emoji: '📸', desc: 'مع إرسال الصورة أو الفيديو مباشرة' },
            { key: 'notifyOnNewStory',  label: 'ستوري جديدة',         emoji: '🔴', desc: 'مع محتوى الستوري + إشعار الحذف' },
            { key: 'notifyOnBioChange', label: 'تغيير السيرة الذاتية', emoji: '✏️', desc: 'النص القديم والجديد' },
            { key: 'notifyOnPrivate',   label: 'تغيير الخصوصية',     emoji: '🔒', desc: 'خاص ← عام أو العكس' },
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
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings[key as keyof Settings] ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* زر الحفظ */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
        <Save size={16} className={saving ? 'animate-spin' : ''} />
        {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
      </button>
    </div>
  )
}
