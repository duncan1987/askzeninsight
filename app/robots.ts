import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

export default function robots(): MetadataRoute.Robots {
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
