# Alpha Insta Monitor — وثيقة الملخص الشامل للموقع

**الإصدار:** 2.0 | **التاريخ:** يونيو 2026
**الرابط الإنتاجي:** https://alpha-insta-monitor.vercel.app

---

## 🌐 نظرة عامة على النظام

Alpha Insta Monitor منصة مراقبة لحسابات Instagram مبنية بـ Next.js 14. تتيح للمشرف متابعة حسابات متعددة، استقبال إشعارات تيليجرام، وإتاحة عرض للقراءة فقط لأشخاص محددين عبر أكواد إحالة.

---

## 🗂 بنية الصفحات

### صفحات المشرف (تتطلب تسجيل دخول)

| الصفحة | الرابط | الوصف |
|--------|--------|--------|
| لوحة التحكم | `/dashboard` | ملخص عام، مخطط المتابعين، آخر النشاطات، أكثر الحسابات متابعين |
| الحسابات | `/dashboard/accounts` | إدارة حسابات Instagram المراقبة (إضافة، حذف، مزامنة، مسح السجل) |
| الإحصائيات | `/dashboard/analytics` | مخططات بيانات حقيقية من الـ snapshots، آخر نشاط لكل حساب |
| الإحالات | `/dashboard/referrals` | إنشاء وإدارة أكواد الإحالة بكامل الضبط |
| الإعدادات | `/dashboard/settings` | Apify Token، بوت تيليجرام، إشعارات، رابط الـ Cron |

### صفحات عامة (بدون تسجيل دخول)

| الصفحة | الرابط | الوصف |
|--------|--------|--------|
| تسجيل الدخول | `/login` | صفحة دخول المشرف |
| عرض الإحالة | `/view?code=XXXXXXXX` | صفحة عرض للقراءة فقط بكود إحالة |

---

## 🔑 نظام المصادقة

- **المشرف الرئيسي:** بريده وكلمة مروره من `ADMIN_EMAIL` و `ADMIN_PASSWORD` في Vercel
- **تسجيل الدخول:** صفحة `/login` بنظام NextAuth + JWT (جلسة 30 يوم)
- **الحماية:** Middleware يحمي كل الصفحات ما عدا `/login`، `/view`، `/api/referral/view`، `/api/setup`

---

## 👁 ميزة كود الإحالة — عرض للقراءة فقط

### كيف يعمل
1. المشرف ينشئ كوداً من صفحة `/dashboard/referrals`
2. يرسل الرابط: `https://alpha-insta-monitor.vercel.app/view?code=XXXXXXXX`
3. الشخص المستلم يفتح الرابط مباشرة — **بدون تسجيل دخول**
4. يرى الحسابات المسموح بها، أرقامها، سجل نشاطاتها — **للقراءة فقط**
5. لا يوجد أي زر تعديل أو حذف في صفحة العرض

### ضبط الكود (جديد)
- **التسمية:** اسم وصفي للكود (مثال: "كود أحمد للمتابعة")
- **الصلاحية:** عدد أيام الصلاحية (0 = بلا انتهاء)
- **الحد الأقصى للاستخدام:** عدد مرات فتح الرابط (افتراضي: 1)
- **الحسابات المسموح بها:** المشرف يختار من قائمة أي حسابات يراها الشخص

---

## 📊 صفحة الإحصائيات (Analytics)

- **مخطط حقيقي:** يعتمد على بيانات Snapshots الفعلية المخزنة، لا بيانات عشوائية
- **اختيار الحساب:** المشرف يختار حساباً من تبويبات لمشاهدة منحنى تطور متابعيه
- **إجمالي:** مجموع المتابعين، المتوسط، نمو/تراجع الفترة، إجمالي المنشورات
- **جدول آخر نشاط:** لكل حساب — يعرض "آخر نشاط" حسب lastPostTime / lastStoryTime / lastChecked

---

## 🕵️ ميزة آخر ظهور (Last Seen)

في كل بطاقة حساب تظهر:
- **آخر نشاط** (أحدث وقت بين: آخر منشور، آخر ستوري، آخر مزامنة)
- **آخر منشور:** من `lastPostTime`
- **آخر ستوري:** من `lastStoryTime`
- آخر مزامنة: من `lastChecked`

---

## 🗑 زر مسح السجل

- في صفحة الحسابات: زر **"مسح السجل"** يحذف جميع النشاطات لجميع الحسابات
- يعمل عبر `DELETE /api/activities` مع تأكيد قبل التنفيذ

---

## 🔌 API Routes الكاملة

### حسابات Instagram
| Route | Method | الوصف |
|-------|--------|--------|
| `/api/accounts` | GET | جلب كل الحسابات |
| `/api/accounts` | POST | إضافة حساب جديد |
| `/api/accounts/[id]` | PATCH | تحديث (isTracked / followers / etc) |
| `/api/accounts/[id]` | DELETE | حذف حساب |
| `/api/accounts/[id]/sync` | POST | مزامنة بيانات الحساب من Instagram |
| `/api/accounts/[id]/snapshots` | GET | جلب snapshots الحساب للرسم البياني |

### النشاطات
| Route | Method | الوصف |
|-------|--------|--------|
| `/api/activities` | GET | جلب سجل النشاطات |
| `/api/activities` | DELETE | مسح السجل (كله أو حساب بعينه) |

### الإحالات
| Route | Method | الوصف |
|-------|--------|--------|
| `/api/referral` | GET | جلب كل الأكواد (مشرف فقط) |
| `/api/referral` | POST | إنشاء كود جديد |
| `/api/referral` | PATCH | تحديث كود (label, maxUses, expiresAt, allowedAccounts) |
| `/api/referral` | DELETE | حذف كود |
| `/api/referral/view` | GET | جلب البيانات بكود إحالة (عام، بدون auth) |

### متنوع
| Route | Method | الوصف |
|-------|--------|--------|
| `/api/settings` | GET/PUT/POST | الإعدادات + اختبار تيليجرام |
| `/api/stats` | GET | إحصائيات لوحة التحكم |
| `/api/cron/monitor` | GET | الـ Cron Job للمزامنة التلقائية |
| `/api/setup` | GET | إنشاء جداول DB + إضافة أعمدة ناقصة |

---

## 🗄 قاعدة البيانات (PostgreSQL + Prisma)

### جداول المشروع

**`users`** — المستخدمون
```
id, email, password, name, role (ADMIN/USER), isActive, createdAt, updatedAt, usedCodeId
```

**`accounts`** — حسابات Instagram
```
id, username, fullName, avatar, bio, followers, following, posts,
isTracked, status (ACTIVE/INACTIVE/ERROR/PENDING),
lastChecked, lastPostId, lastPostTime, lastStoryId, lastStoryTime,
followersAtLastSync, createdAt, updatedAt, userId
```

**`activities`** — سجل النشاطات
```
id, type (FOLLOWER_GAIN/FOLLOWER_LOSS/NEW_POST/NEW_STORY/PROFILE_CHANGE/STATUS_CHANGE/ERROR),
message, data (JSONB), createdAt, accountId
```

**`follower_snapshots`** — لقطات المتابعين للرسوم البيانية
```
id, followers, following, posts, recordedAt, accountId
```

**`referral_codes`** — أكواد الإحالة
```
id, code (unique), label, isUsed, maxUses, usedCount,
expiresAt, allowedAccounts (JSON array of account IDs), createdAt, creatorId
```

**`settings`** — إعدادات النظام
```
id, telegramBotToken, telegramChatId, apifyApiToken, webhookUrl, webhookEnabled,
notifyOnFollow, notifyOnUnfollow, notifyOnNewPost, notifyOnNewStory, notifyOnBioChange,
checkIntervalMins, updatedAt
```

---

## ⚙️ الإعدادات الكاملة (Settings)

### Apify (جلب Instagram)
- **الحصول على Token:** apify.com ← Settings ← API & Integrations ← Personal API Token
- **الوظيفة:** جلب الملف الشخصي، المنشورات، الستوريز لكل حساب مراقب

### بوت تيليجرام (الإشعارات)
- **Bot Token:** من @BotFather
- **Chat ID:** من @userinfobot
- **زر اختبار:** إرسال رسالة تجريبية للتحقق

### أنواع الإشعارات
- ✅ متابعون جدد (مع صورة الملف)
- ✅ فقدان متابعين
- ✅ منشور جديد (مع إرسال الصورة)
- ✅ ستوري جديدة (مع المحتوى)
- ✅ تغيير السيرة الذاتية

### المراقبة التلقائية (Cron)
- **الخدمة المقترحة:** cron-job.org (مجاني 100%)
- **الرابط:** `https://alpha-insta-monitor.vercel.app/api/cron/monitor`
- **Header:** `Authorization: Bearer CRON_SECRET`
- **التكرار:** كل 30 دقيقة (أو أكثر حسب خطة Vercel)

---

## 🔧 متغيرات البيئة (Vercel)

| المتغير | الوصف |
|---------|--------|
| `DATABASE_URL` | رابط PostgreSQL |
| `NEXTAUTH_SECRET` | مفتاح تشفير الجلسة |
| `ADMIN_EMAIL` | بريد المشرف |
| `ADMIN_PASSWORD` | كلمة مرور المشرف |
| `ADMIN_NAME` | اسم المشرف (اختياري) |
| `CRON_SECRET` | مفتاح تشغيل الـ Cron |
| `APIFY_API_TOKEN` | رمز Apify للمزامنة |

---

## 🔒 الأمان

- كل صفحات الـ dashboard تتطلب JWT صالح
- صفحة `/view` عامة لكن محمية بكود إحالة + حد استخدام + تاريخ انتهاء
- `ADMIN_EMAIL` و `ADMIN_PASSWORD` تُحفظ فقط في Vercel Environment Variables
- كلمات مرور المستخدمين مشفّرة بـ bcrypt

---

## 🛠 الإعداد الأولي (أول مرة)

1. افتح: `https://alpha-insta-monitor.vercel.app/api/setup?key=setup2024`
2. انتظر حتى يظهر: `✅ تم إنشاء جميع الجداول بنجاح`
3. سجّل الدخول من: `https://alpha-insta-monitor.vercel.app/login`
4. أضف حسابات Instagram من صفحة الحسابات
5. اضبط Apify Token وبوت تيليجرام من الإعدادات
6. أنشئ أكواد إحالة لمن تريد إطلاعهم على البيانات

---

## 🚀 Stack التقني

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| Next.js | 14 | إطار العمل الرئيسي (App Router) |
| TypeScript | 5 | لغة البرمجة |
| Prisma | 5 | ORM لقاعدة البيانات |
| PostgreSQL | - | قاعدة البيانات |
| NextAuth | 4 | المصادقة |
| Apify | - | جلب بيانات Instagram |
| Recharts | - | الرسوم البيانية |
| Tailwind CSS | 3 | التصميم |
| Vercel | - | الاستضافة والنشر |
| Sonner | - | الإشعارات (toast) |

---

## ✅ الميزات المنجزة (11 من 11)

1. ✅ **التحقق من كل الأزرار** — تم مراجعة وإصلاح كل الأزرار في جميع الصفحات
2. ✅ **آخر ظهور (Last Seen)** — يظهر في بطاقة كل حساب مع تفصيل (آخر منشور، آخر ستوري، آخر مزامنة)
3. ✅ **معلومات أغنى** — عرض السيرة الذاتية، آخر نشاط مع التواريخ الحقيقية في Analytics
4. ✅ **المزيد من الميزات** — مخطط تطور المتابعين الحقيقي من الـ snapshots، جدول آخر نشاط
5. ✅ **صفحة إدخال كود الإحالة** — `/view?code=XXXX` صفحة عامة كاملة للعرض
6. ✅ **زر مسح السجل** — زر "مسح السجل" في صفحة الحسابات
7. ✅ **ضبط الإحالة** — صلاحية (بالأيام)، حد أقصى للاستخدام، اختيار حسابات محددة
8. ✅ **مراجعة كل الأزرار** — كل الأزرار موثّقة وتعمل
9. ✅ **تحكم كامل بالإعدادات** — Apify، تيليجرام، أنواع الإشعارات، رابط Cron
10. ✅ **المشرف يختار الحسابات** — عند إنشاء كود إحالة، يختار المشرف أي حسابات يراها الشخص
11. ✅ **مشاهدو الإحالة للقراءة فقط** — صفحة `/view` لا تحتوي على أي أزرار تعديل
