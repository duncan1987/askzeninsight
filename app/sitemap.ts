import type { MetadataRoute } from 'next'
import { getAllPostsMeta } from '@/lib/blog'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ask.zeninsight.xyz'

const publicPages = [
  {
    path: '/',
    priority: 1.0,
    changeFrequency: 'weekly' as const,
  },
  {
    path: '/chat/',
    priority: 0.9,
    changeFrequency: 'weekly' as const,
  },
  {
    path: '/meditation/',
    priority: 0.9,
    changeFrequency: 'weekly' as const,
  },
  {
    path: '/meditation/level-1/',
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  },
  {
    path: '/blog/',
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  },
  {
    path: '/about/',
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/pricing/',
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/faq/',
    priority: 0.6,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/contact/',
    priority: 0.6,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/privacy/',
    priority: 0.3,
    changeFrequency: 'yearly' as const,
  },
  {
    path: '/terms/',
    priority: 0.3,
    changeFrequency: 'yearly' as const,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = publicPages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const blogPosts = getAllPostsMeta().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...blogPosts]
}
