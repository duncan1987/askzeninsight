import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for self-hosted deployment (EC2). Skipped on Windows
  // because copying pnpm's symlinked node_modules layout requires symlink
  // privileges (EPERM); CI builds on Linux where this works normally.
  // Vercel ignores this option, so production deploys are unaffected.
  ...(process.platform === 'win32' ? {} : { output: 'standalone' }),
  // Self-hosted behind nginx: Next standalone otherwise reconstructs
  // request.url from its own bind address (HOSTNAME=0.0.0.0), producing
  // redirects to https://0.0.0.0:3000 (e.g. the OAuth callback). This
  // makes request.url use the Host header passed by the proxy instead.
  experimental: {
    trustHostHeader: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // pdf-parse v2 embeds pdf.js as data-URL modules and must stay external.
  // Specifying includes for this route REPLACES Next's automatic externals
  // tracing for it, so BOTH packages must be listed explicitly:
  //   - pdf-parse: the parser itself (CJS bundle + worker, data-URL embedded)
  //   - pdfjs-dist: pdf.js lazily imports its "fake worker" via a dynamic
  //     path that tracing cannot see ("Cannot find module .../pdf.worker.mjs")
  // Browser globals (DOMMatrix et al.) come from lib/pdf-globals instead —
  // @napi-rs/canvas is unresolvable in the standalone pnpm layout.
  serverExternalPackages: ['pdf-parse'],
  outputFileTracingIncludes: {
    '/api/admin/kb/upload': [
      './node_modules/pdf-parse/dist/**/*.{js,cjs,mjs}',
      './node_modules/pdfjs-dist/**/*.{js,mjs,cjs}',
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
