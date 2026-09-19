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
  // pdf-parse v2 embeds pdf.js as data-URL modules and must stay external.
  // pdf.js lazily imports pdfjs-dist's worker ("fake worker" setup) via a
  // dynamic path that static tracing cannot see — without this include the
  // standalone build throws "Cannot find module .../legacy/build/pdf.worker.mjs"
  // at getText(). Browser globals (DOMMatrix et al.) come from lib/pdf-globals.
  serverExternalPackages: ['pdf-parse'],
  outputFileTracingIncludes: {
    '/api/admin/kb/upload': ['./node_modules/pdfjs-dist/**/*.{js,mjs,cjs}'],
  },
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
