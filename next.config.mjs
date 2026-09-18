import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for self-hosted deployment (EC2). Skipped on Windows
  // because copying pnpm's symlinked node_modules layout requires symlink
  // privileges (EPERM); CI builds on Linux where this works normally.
  // Vercel ignores this option, so production deploys are unaffected.
  ...(process.platform === 'win32' ? {} : { output: 'standalone' }),
  typescript: {
    ignoreBuildErrors: true,
  },
  // pdf-parse v2 is a CommonMode native-ish package that must stay external
  // so the Next.js server runtime can load it at runtime.
  serverExternalPackages: ['pdf-parse'],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/&',
        destination: '/',
        permanent: true,
      },
      {
        source: '/meditation',
        destination: '/study',
        permanent: true,
      },
      {
        source: '/meditation/:path*',
        destination: '/study',
        permanent: true,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
