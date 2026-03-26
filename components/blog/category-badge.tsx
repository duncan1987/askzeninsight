import { Tag } from 'lucide-react'
import { getCategoryName } from '@/lib/blog'

interface CategoryBadgeProps {
  category: string
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground">
      <Tag className="h-3 w-3" />
      {getCategoryName(category)}
    </span>
  )
}
