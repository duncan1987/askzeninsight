import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ask.zeninsight.xyz'

// 定义要包含在站点地图中的页面
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

// 动态生成的分享页面（如果有的话）
// 注意：如果你有大量的动态页面，应该从数据库或 CMS 中获取
const getSharedPages = async () => {
  // 这里可以添加逻辑从数据库获取共享页面
  // 例如：const sharedConversations = await db.query.sharedConversations.findMany()
  // return sharedConversations.map(conv => ({ path: `/share/${conv.id}`, ... }))

  // 目前返回空数组，因为还没有实际的分享页面数据
  return []
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = publicPages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const dynamicPages = await getSharedPages()

  return [...staticPages, ...dynamicPages]
}
