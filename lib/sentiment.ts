// تحليل مشاعر التعليقات (عربي + إنجليزي) — بدون حزم خارجية
export interface SentimentResult {
  score: number       // -5 إلى +5
  label: 'positive' | 'negative' | 'neutral'
  emoji: string
  confidence: number  // 0-100
}

const POSITIVE_AR = [
  'رائع','جميل','ممتاز','أحبك','حلو','مبدع','عظيم','بديع','مذهل','ولله','ماشاء الله',
  'تمام','أجمل','احبك','روعة','جمال','يسلم','برافو','حلال','نجح','مبروك','مبارك',
  'ابداع','شكرا','شكراً','محتاج','استمر','ممتع','اروع','فخور','رائعة','حلوه','مثالي',
  'احلى','يا روعة','ما شاء الله','اللهم صل','صح','يسلموا','❤️','🔥','💯','😍','🥰',
]

const NEGATIVE_AR = [
  'سيء','فظيع','أكره','مزعج','مقرف','بيقرف','ردي','وحش','محبط','زباله','زفت',
  'غلط','خطأ','كذب','مزيف','احتيال','مكره','اشمئزاز','مريض','انت غبي','غبي',
  'حقير','لا تستحق','مخسوف','ملعون','ازعج','ما يستاهل','وحشه','مره وحش','اشمئز',
  'ما احب','لا يعجبني','مقزز','سخيف','تافه','😤','😡','🤮','👎','💔',
]

const POSITIVE_EN = [
  'love','great','amazing','beautiful','awesome','perfect','fantastic','wonderful',
  'excellent','brilliant','gorgeous','stunning','incredible','best','nice','good',
  'cool','wow','fire','lit','blessed','happy','proud','congrats','congratulations',
]

const NEGATIVE_EN = [
  'hate','bad','ugly','terrible','horrible','awful','disgusting','worst','boring',
  'fake','liar','scam','stupid','idiot','dumb','pathetic','trash','garbage',
  'disappointing','useless','worthless','annoying',
]

export function analyzeSentiment(text: string): SentimentResult {
  if (!text || !text.trim()) {
    return { score: 0, label: 'neutral', emoji: '😐', confidence: 0 }
  }
  const lower = text.toLowerCase()
  let score = 0

  for (const w of POSITIVE_AR) {
    if (lower.includes(w)) score += 1.2
  }
  for (const w of NEGATIVE_AR) {
    if (lower.includes(w)) score -= 1.2
  }
  for (const w of POSITIVE_EN) {
    if (lower.includes(w)) score += 1
  }
  for (const w of NEGATIVE_EN) {
    if (lower.includes(w)) score -= 1
  }

  // كلمات التشديد
  if (/جداً|جدا|كثير|أوي|اوي|very|so much|really/i.test(lower)) {
    score *= 1.3
  }
  // النفي
  if (/ما |مو |مش |لا |ليس|not |don't|doesn't/i.test(lower)) {
    score *= -0.8
  }

  const clamped = Math.max(-5, Math.min(5, score))
  const confidence = Math.min(100, Math.abs(clamped) * 20)

  let label: SentimentResult['label']
  let emoji: string
  if (clamped > 0.5) { label = 'positive'; emoji = '😊' }
  else if (clamped < -0.5) { label = 'negative'; emoji = '😠' }
  else { label = 'neutral'; emoji = '😐' }

  return { score: Math.round(clamped * 10) / 10, label, emoji, confidence: Math.round(confidence) }
}

export function analyzeBulk(texts: string[]): {
  positive: number
  negative: number
  neutral: number
  avgScore: number
  results: SentimentResult[]
} {
  const results = texts.map(analyzeSentiment)
  const positive = results.filter(r => r.label === 'positive').length
  const negative = results.filter(r => r.label === 'negative').length
  const neutral  = results.filter(r => r.label === 'neutral').length
  const avgScore = results.length > 0
    ? Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 10) / 10
    : 0
  return { positive, negative, neutral, avgScore, results }
}
