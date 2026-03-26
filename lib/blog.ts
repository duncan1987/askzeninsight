import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

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

export const BLOG_CATEGORIES = [
  { name: 'Meditation', slug: 'meditation' },
  { name: 'Zen Philosophy', slug: 'zen-philosophy' },
  { name: 'Mindfulness', slug: 'mindfulness' },
  { name: 'Spiritual Growth', slug: 'spiritual-growth' },
  { name: 'Practice Guide', slug: 'practice-guide' },
] as const

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]['slug']

function readMdxFile(filePath: string): { data: Record<string, unknown>; content: string } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return matter(raw)
}

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

  const posts = files.map((file) => {
    const { data, content } = readMdxFile(path.join(BLOG_DIR, file))
    const slug = file.replace(/\.mdx$/, '')

    return {
      slug,
      title: (data.title as string) || slug,
      description: (data.description as string) || '',
      date: (data.date as string) || new Date().toISOString(),
      updated: data.updated as string | undefined,
      category: (data.category as string) || 'meditation',
      tags: (data.tags as string[]) || [],
      image: (data.image as string) || '/og-image.svg',
      imageAlt: (data.imageAlt as string) || '',
      author: (data.author as string) || 'koji',
      readTime: (data.readTime as number) || estimateReadTime(content),
      draft: (data.draft as boolean) || false,
      featured: (data.featured as boolean) || false,
      content,
    } satisfies BlogPost
  })

  return posts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getAllPostsMeta(): BlogPostMeta[] {
  return getAllPosts().map(({ content: _, ...meta }) => meta)
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const { data, content } = readMdxFile(filePath)

  return {
    slug,
    title: (data.title as string) || slug,
    description: (data.description as string) || '',
    date: (data.date as string) || new Date().toISOString(),
    updated: data.updated as string | undefined,
    category: (data.category as string) || 'meditation',
    tags: (data.tags as string[]) || [],
    image: (data.image as string) || '/og-image.svg',
    imageAlt: (data.imageAlt as string) || '',
    author: (data.author as string) || 'koji',
    readTime: (data.readTime as number) || estimateReadTime(content),
    draft: (data.draft as boolean) || false,
    featured: (data.featured as boolean) || false,
    content,
  }
}

export function getFeaturedPosts(limit = 3): BlogPostMeta[] {
  const featured = getAllPosts().filter((p) => p.featured)
  return featured.length >= limit ? featured.slice(0, limit) : getAllPosts().slice(0, limit)
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getAllPostsMeta().filter((p) => p.category === category)
}

export function getRelatedPosts(currentSlug: string, tags: string[], limit = 3): BlogPostMeta[] {
  const allPosts = getAllPostsMeta().filter((p) => p.slug !== currentSlug)

  const scored = allPosts.map((post) => {
    const commonTags = post.tags.filter((t) => tags.includes(t))
    return { post, score: commonTags.length }
  })

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.post)
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug)
}

export function getAllTags(): string[] {
  const tags = new Set<string>()
  getAllPosts().forEach((p) => p.tags.forEach((t) => tags.add(t)))
  return Array.from(tags).sort()
}

export function getCategoryName(slug: string): string {
  return BLOG_CATEGORIES.find((c) => c.slug === slug)?.name || slug
}
