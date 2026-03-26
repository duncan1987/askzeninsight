import { Card } from '@/components/ui/card'
import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { BlogPostMeta } from '@/lib/blog'
import { CategoryBadge } from './category-badge'

interface BlogCardProps {
  post: BlogPostMeta
  featured?: boolean
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <Card className="group overflow-hidden border border-border bg-card transition-all hover:shadow-lg hover:border-primary/30">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className={`relative overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
          <Image
            src={post.image}
            alt={post.imageAlt || post.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute top-4 left-4">
            <CategoryBadge category={post.category} />
          </div>
          {post.featured && (
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-medium text-white">
                Featured
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-6">
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readTime} min read
          </span>
        </div>
        <Link href={`/blog/${post.slug}`}>
          <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {post.description}
        </p>
      </div>
    </Card>
  )
}
