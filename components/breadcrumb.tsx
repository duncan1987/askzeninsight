import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  name: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`w-full ${className}`}>
      <ol
        className="flex items-center space-x-2 text-sm"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => (
          <li
            key={item.href}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
            {item.href === items[items.length - 1].href ? (
              <span itemProp="name">{item.name}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:underline underline-offset-4 transition-colors"
              >
                <span itemProp="name">{item.name}</span>
              </Link>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  )
}
