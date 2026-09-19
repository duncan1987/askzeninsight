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
  // pdf-parse v2 must stay external (native-ish CJS bundle). Its runtime
  // require of pdfjs-dist is built via eval'd strings that file tracing
  // cannot see statically, so force-include both packages for the upload
  // route to guarantee a complete standalone output.
  serverExternalPackages: ['pdf-parse'],
  outputFileTracingIncludes: {
    '/api/admin/kb/upload': [
      './node_modules/pdf-parse/dist/**/*.{js,cjs,mjs}',
      './node_modules/pdfjs-dist/**/*.{js,cjs,mjs}',
    ],
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
