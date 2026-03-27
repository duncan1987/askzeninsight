import { headers } from 'next/headers'
import type { MetadataRoute } from 'next'

const PRODUCTION_URL = 'https://ask.zeninsight.xyz'

async function getSiteUrl(): Promise<string> {
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = headersList.get('x-forwarded-proto') || 'https'
    if (host && !host.includes('localhost')) {
      return `${protocol}://${host}`
    }
  } catch {
    // headers() not available during build time
  }
  return PRODUCTION_URL
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 禁止爬取管理员、调试和用户特定页面
        disallow: ['/admin/', '/debug/', '/dashboard/', '/test-auth'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
