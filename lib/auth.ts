// إعداد NextAuth للمصادقة
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// ID ثابت للمشرف - يُستخدم كمرجع موحّد في DB
const ADMIN_STATIC_ID = 'admin-static-id'

// يتأكد من وجود سجل المشرف في DB ويُنشئه إن لم يكن موجوداً
async function ensureAdminInDb(email: string, name: string) {
  try {
    const { prisma } = await import('./prisma')
    await prisma.user.upsert({
      where: { id: ADMIN_STATIC_ID },
      update: { email, name, updatedAt: new Date() },
      create: {
        id: ADMIN_STATIC_ID,
        email,
        name,
        password: 'admin-no-password',
        role: 'ADMIN',
        isActive: true,
      },
    })
  } catch {
    // تجاهل أخطاء DB - تسجيل الدخول يعمل بغض النظر
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('بريد إلكتروني وكلمة مرور مطلوبان')
        }

        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        const adminName = process.env.ADMIN_NAME || 'Admin'

        // ✅ المشرف الرئيسي: التحقق مباشرة من متغيرات البيئة
        if (
          credentials.email.trim().toLowerCase() === adminEmail?.trim().toLowerCase() &&
          credentials.password === adminPassword
        ) {
          // تأكيد وجود المشرف في DB حتى تعمل العلاقات (accounts, etc.)
          await ensureAdminInDb(adminEmail!, adminName)

          return {
            id: ADMIN_STATIC_ID,
            email: adminEmail!,
            name: adminName,
            role: 'ADMIN',
          }
        }

        // التحقق من المستخدمين العاديين من قاعدة البيانات
        try {
          const { prisma } = await import('./prisma')
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user || !user.isActive) {
            throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (err) {
          const msg = String(err)
          if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('connect')) {
            throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة')
          }
          throw err
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as unknown as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 يوم
  },

  secret: process.env.NEXTAUTH_SECRET,
}

// توسيع أنواع NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
