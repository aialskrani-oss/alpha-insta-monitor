/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.instagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
      { protocol: 'https', hostname: 'scontent-*.cdninstagram.com' },
      { protocol: 'https', hostname: 'instagram.*.fna.fbcdn.net' },
      { protocol: 'https', hostname: '*.fna.fbcdn.net' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
    dangerouslyAllowSVG: true,
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
}

module.exports = nextConfig
