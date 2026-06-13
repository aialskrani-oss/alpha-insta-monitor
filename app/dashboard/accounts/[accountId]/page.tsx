'use client'
// صفحة تفاصيل الحساب: تعليقات + تحليل مشاعر + تغييرات المتابعين
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowRight, MessageCircle, TrendingUp, TrendingDown,
  RefreshCw, Loader2, AlertCircle, User, BarChart2,
  History, ChevronRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { timeAgo, formatNumber } from '@/lib/utils'
import { analyzeSentiment, analyzeBulk } from '@/lib/sentiment'
import type { Account, Comment, FollowerChange } from '@/types'

type Tab = 'overview' | 'comments' | 'changes'

function SentimentBadge({ text }: { text: string }) {
  const s = analyzeSentiment(text)
  const colors: Record<string, string> = {
    positive: 'bg-green-500/15 text-green-400 border-green-500/20',
    negative: 'bg-red-500/15 text-red-400 border-red-500/20',
    neutral: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${colors[s.label]}`}>
      {s.emoji} {s.score > 0 ? '+' : ''}{s.score}
    </span>
  )
}

export default function AccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.accountId as string
  const [tab, setTab] = useState<Tab>('overview')
  const [account, setAccount] = useState<Account | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [changes, setChanges] = useState<FollowerChange[]>([])
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [changesLoading, setChangesLoading] = useState(false)
  const [fetchingComments, setFetchingComments] = useState(false)
  const [fetchingChanges, setFetchingChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // جلب بيانات الحساب
  useEffect(() => {
    fetch(`/api/accounts/${accountId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAccount(d.data); else setError(d.error || 'تعذّر جلب الحساب') })
      .catch(() => setError('خطأ في الاتصال'))
      .finally(() => setLoading(false))
  }, [accountId])

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    try {
      const res = await fetch(`/api/instagram/comments?accountId=${accountId}&limit=50`)
      const d = await res.json()
      if (d.success) setComments(d.data)
    } finally { setCommentsLoading(false) }
  }, [accountId])

  const loadChanges = useCallback(async () => {
    setChangesLoading(true)
    try {
      const res = await fetch(`/api/instagram/account-changes?accountId=${accountId}&limit=30`)
      const d = await res.json()
      if (d.success) setChanges(d.data)
    } finally { setChangesLoading(false) }
  }, [accountId])

  useEffect(() => {
    if (tab === 'comments' && comments.length === 0) loadComments()
    if (tab === 'changes' && changes.length === 0) loadChanges()
  }, [tab, comments.length, changes.length, loadComments, loadChanges])

  const handleFetchComments = async () => {
    setFetchingComments(true)
    try {
      await fetch('/api/instagram/comments', { method: 'POST' })
      await loadComments()
    } finally { setFetchingComments(false) }
  }

  const handleScanChanges = async () => {
    setFetchingChanges(true)
    try {
      await fetch('/api/instagram/account-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      await loadChanges()
    } finally { setFetchingChanges(false) }
  }

  // إحصاء المشاعر
  const sentimentStats = comments.length > 0
    ? analyzeBulk(comments.map(c => c.text))
    : null

  // رسم بياني للمتابعين من changes
  const chartData = [...changes]
    .reverse()
    .slice(-20)
    .map(c => ({
      date: new Date(c.recordedAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
      متابعون: c.newCount,
      تغيير: c.change,
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-cyber-muted gap-2">
        <Loader2 size={20} className="animate-spin" /><span>جارٍ التحميل…</span>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-red-400">{error || 'الحساب غير موجود'}</p>
        <button onClick={() => router.back()} className="text-sm text-ig-purple hover:underline flex items-center gap-1">
          <ArrowRight size={14} /> عودة
        </button>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: <User size={14} /> },
    { id: 'comments', label: `تعليقات (${comments.length})`, icon: <MessageCircle size={14} /> },
    { id: 'changes', label: `التغييرات (${changes.length})`, icon: <History size={14} /> },
  ]

  return (
    <div className="space-y-5">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl text-cyber-muted hover:text-white hover:bg-cyber-border transition-colors">
          <ArrowRight size={16} />
        </button>
        <div className="w-10 h-10 rounded-full ig-gradient flex items-center justify-center text-white font-bold shrink-0">
          {account.username[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">@{account.username}</h1>
          <p className="text-xs text-cyber-muted">{account.fullName || 'بدون اسم'}</p>
        </div>
        <div className="mr-auto flex items-center gap-2 text-xs">
          <span className={`px-2 py-1 rounded-full border ${account.isPrivate ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
            {account.isPrivate ? '🔒 خاص' : '🌐 عام'}
          </span>
        </div>
      </div>

      {/* إحصاء سريع */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'متابعون', value: formatNumber(account.followers), icon: <TrendingUp size={14} className="text-ig-purple" /> },
          { label: 'يتابع', value: formatNumber(account.following), icon: <ChevronRight size={14} className="text-ig-orange" /> },
          { label: 'منشورات', value: formatNumber(account.posts), icon: <BarChart2 size={14} className="text-blue-400" /> },
        ].map(item => (
          <div key={item.label} className="glass rounded-xl border border-cyber-border p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">{item.icon}<span className="text-xs text-cyber-muted">{item.label}</span></div>
            <p className="text-lg font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* تبويبات */}
      <div className="flex gap-1 p-1 glass rounded-xl border border-cyber-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-ig-purple/20 text-ig-pink border border-ig-purple/20'
                : 'text-cyber-muted hover:text-white'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* نظرة عامة */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {account.bio && (
            <div className="glass rounded-xl border border-cyber-border p-4">
              <p className="text-xs text-cyber-muted mb-2">السيرة الذاتية</p>
              <p className="text-sm text-white leading-relaxed">{account.bio}</p>
            </div>
          )}
          <div className="glass rounded-xl border border-cyber-border p-4">
            <p className="text-xs text-cyber-muted mb-3">معلومات المراقبة</p>
            <div className="space-y-2 text-sm">
              {account.lastChecked && <p className="flex justify-between"><span className="text-cyber-muted">آخر فحص</span><span className="text-white">{timeAgo(account.lastChecked)}</span></p>}
              {account.lastPostTime && <p className="flex justify-between"><span className="text-cyber-muted">آخر منشور</span><span className="text-white">{timeAgo(account.lastPostTime)}</span></p>}
              {(account as Account & {lastBioChangeAt?: string}).lastBioChangeAt && <p className="flex justify-between"><span className="text-cyber-muted">آخر تغيير بايو</span><span className="text-white">{timeAgo((account as Account & {lastBioChangeAt?: string}).lastBioChangeAt!)}</span></p>}
              {(account as Account & {lastPpChangeAt?: string}).lastPpChangeAt && <p className="flex justify-between"><span className="text-cyber-muted">آخر تغيير صورة</span><span className="text-white">{timeAgo((account as Account & {lastPpChangeAt?: string}).lastPpChangeAt!)}</span></p>}
            </div>
          </div>
          {changes.length > 0 && chartData.length > 1 && (
            <div className="glass rounded-xl border border-cyber-border p-4">
              <p className="text-xs text-cyber-muted mb-3 flex items-center gap-2"><TrendingUp size={12} /> منحنى المتابعين</p>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid #2d2d4e', borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="متابعون" stroke="#9333ea" fill="url(#fGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* تعليقات */}
      {tab === 'comments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-cyber-muted">{comments.length} تعليق محفوظ</p>
            <div className="flex gap-2">
              <button onClick={loadComments} disabled={commentsLoading}
                className="p-2 rounded-xl text-cyber-muted hover:text-white hover:bg-cyber-border transition-colors">
                <RefreshCw size={14} className={commentsLoading ? 'animate-spin' : ''} />
              </button>
              <button onClick={handleFetchComments} disabled={fetchingComments}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-ig-purple/10 text-ig-purple border border-ig-purple/20 hover:bg-ig-purple/20 transition-all disabled:opacity-50">
                {fetchingComments ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
                جلب جديد
              </button>
            </div>
          </div>

          {/* إحصاء المشاعر */}
          {sentimentStats && comments.length > 0 && (
            <div className="glass rounded-xl border border-cyber-border p-4">
              <p className="text-xs text-cyber-muted mb-3 flex items-center gap-2"><BarChart2 size={12} /> تحليل مشاعر التعليقات</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: 'إيجابية', value: sentimentStats.positive, color: 'text-green-400', bg: 'bg-green-500/10', emoji: '😊' },
                  { label: 'سلبية', value: sentimentStats.negative, color: 'text-red-400', bg: 'bg-red-500/10', emoji: '😠' },
                  { label: 'محايدة', value: sentimentStats.neutral, color: 'text-gray-400', bg: 'bg-gray-500/10', emoji: '😐' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className="text-lg">{s.emoji}</p>
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-cyber-muted">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${(sentimentStats.positive / comments.length) * 100}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${(sentimentStats.negative / comments.length) * 100}%` }} />
                  <div className="h-full bg-gray-600" style={{ width: `${(sentimentStats.neutral / comments.length) * 100}%` }} />
                </div>
                <span className="text-xs text-cyber-muted">متوسط: <strong className={sentimentStats.avgScore > 0 ? 'text-green-400' : sentimentStats.avgScore < 0 ? 'text-red-400' : 'text-gray-400'}>{sentimentStats.avgScore > 0 ? '+' : ''}{sentimentStats.avgScore}</strong></span>
              </div>
            </div>
          )}

          {/* قائمة التعليقات */}
          {commentsLoading ? (
            <div className="flex items-center justify-center py-10 text-cyber-muted gap-2">
              <Loader2 size={16} className="animate-spin" /><span className="text-sm">جارٍ التحميل…</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center">
              <MessageCircle size={32} className="mx-auto text-gray-700 mb-2" />
              <p className="text-sm text-cyber-muted">لا توجد تعليقات بعد</p>
              <p className="text-xs text-gray-600 mt-1">اضغط "جلب جديد" لجلبها من Instagram</p>
            </div>
          ) : (
            <div className="glass rounded-xl border border-cyber-border divide-y divide-cyber-border overflow-hidden">
              {comments.map(c => (
                <div key={c.id} className="p-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full ig-gradient flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                      {(c.mediaOwner || '؟')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-ig-purple">@{c.mediaOwner}</span>
                        <SentimentBadge text={c.text} />
                        <span className="text-[10px] text-gray-600">{timeAgo(c.timestamp)}</span>
                      </div>
                      <p className="text-sm text-cyber-text leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* التغييرات */}
      {tab === 'changes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-cyber-muted">{changes.length} تغيير مسجّل</p>
            <div className="flex gap-2">
              <button onClick={loadChanges} disabled={changesLoading}
                className="p-2 rounded-xl text-cyber-muted hover:text-white hover:bg-cyber-border transition-colors">
                <RefreshCw size={14} className={changesLoading ? 'animate-spin' : ''} />
              </button>
              <button onClick={handleScanChanges} disabled={fetchingChanges}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-ig-purple/10 text-ig-purple border border-ig-purple/20 hover:bg-ig-purple/20 transition-all disabled:opacity-50">
                {fetchingChanges ? <Loader2 size={13} className="animate-spin" /> : <History size={13} />}
                فحص الآن
              </button>
            </div>
          </div>

          {changesLoading ? (
            <div className="flex items-center justify-center py-10 text-cyber-muted gap-2">
              <Loader2 size={16} className="animate-spin" /><span className="text-sm">جارٍ التحميل…</span>
            </div>
          ) : changes.length === 0 ? (
            <div className="py-12 text-center">
              <History size={32} className="mx-auto text-gray-700 mb-2" />
              <p className="text-sm text-cyber-muted">لا توجد تغييرات مسجّلة</p>
              <p className="text-xs text-gray-600 mt-1">اضغط "فحص الآن" لكشف التغييرات</p>
            </div>
          ) : (
            <div className="glass rounded-xl border border-cyber-border divide-y divide-cyber-border overflow-hidden">
              {changes.map(c => (
                <div key={c.id} className="p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${c.change > 0 ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                    {c.change > 0
                      ? <TrendingUp size={15} className="text-green-400" />
                      : <TrendingDown size={15} className="text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${c.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {c.change > 0 ? '+' : ''}{c.change.toLocaleString('ar')} متابع
                      </span>
                      <span className="text-xs text-cyber-muted">→ {c.newCount.toLocaleString('ar')}</span>
                    </div>
                    <p className="text-[10px] text-gray-600">{timeAgo(c.recordedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
