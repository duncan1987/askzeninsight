'use client'

import { BlogCard } from './blog-card'
import type { BlogPostMeta } from '@/lib/blog-types'
import { useTranslations } from 'next-intl'

interface RelatedPostsProps {
  posts: BlogPostMeta[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  const t = useTranslations('blog')

  if (posts.length === 0) return null

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        {t('continueReading')}
      </h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
