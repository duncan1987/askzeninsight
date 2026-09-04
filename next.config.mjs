import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
