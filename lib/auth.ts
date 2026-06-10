// إعداد NextAuth للمصادقة
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

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

        // التحقق من المشرف الرئيسي من متغيرات البيئة
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        const adminName = process.env.ADMIN_NAME || 'Admin'

        if (
          credentials.email === adminEmail &&
          credentials.password === adminPassword
        ) {
          // إنشاء أو تحديث حساب المشرف في قاعدة البيانات
          const hashedPassword = await bcrypt.hash(adminPassword!, 10)

          const admin = await prisma.user.upsert({
            where: { email: adminEmail! },
            update: { name: adminName },
            create: {
              email: adminEmail!,
              password: hashedPassword,
              name: adminName,
              role: 'ADMIN',
            },
          })

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          }
        }

        // التحقق من المستخدمين العاديين في قاعدة البيانات
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
