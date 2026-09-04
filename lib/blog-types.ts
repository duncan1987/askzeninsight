export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  updated?: string
  category: string
  tags: string[]
  image: string
  imageAlt: string
  author: string
  readTime: number
  draft: boolean
  featured: boolean
  content: string
}

export interface BlogPostMeta {
  slug: string
  title: string
  description: string
  date: string
  updated?: string
  category: string
  tags: string[]
  image: string
  imageAlt: string
  author: string
  readTime: number
  draft: boolean
  featured: boolean
}

export type BlogCategorySlug = 'meditation' | 'zen-philosophy' | 'mindfulness' | 'spiritual-growth' | 'practice-guide'

export const BLOG_CATEGORIES = [
  { name: 'Meditation', slug: 'meditation' },
  { name: 'Zen Philosophy', slug: 'zen-philosophy' },
  { name: 'Mindfulness', slug: 'mindfulness' },
  { name: 'Spiritual Growth', slug: 'spiritual-growth' },
  { name: 'Practice Guide', slug: 'practice-guide' },
] as const

export function getCategoryName(slug: string): string {
  return BLOG_CATEGORIES.find((c) => c.slug === slug)?.name || slug
}
