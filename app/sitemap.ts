import { headers } from 'next/headers'
import type { MetadataRoute } from 'next'
import { getAllPostsMeta } from '@/lib/blog'

const PRODUCTION_URL = 'https://ask.zeninsight.xyz'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl()

  const staticPages = publicPages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  let blogPosts: MetadataRoute.Sitemap = []
  try {
    blogPosts = getAllPostsMeta().map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated || post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // Blog files may not be available in all environments
  }

  return [...staticPages, ...blogPosts]
}
