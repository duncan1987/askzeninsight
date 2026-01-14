import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const blogPosts = [
  {
    title: "The Power of Daily Prayer in Modern Life",
    excerpt:
      "Discover how incorporating prayer into your daily routine can bring peace, clarity, and spiritual growth in our busy modern world.",
    image: "/peaceful-prayer-meditation.jpg",
    category: "Prayer",
    date: "January 15, 2025",
    readTime: "5 min read",
  },
  {
    title: "Understanding Forgiveness Through Faith",
    excerpt:
      "Explore the spiritual significance of forgiveness and how religious teachings guide us toward healing and reconciliation.",
    image: "/peaceful-forgiveness-light.jpg",
    category: "Faith",
    date: "January 10, 2025",
    readTime: "7 min read",
  },
  {
    title: "Finding Purpose: A Spiritual Perspective",
    excerpt: "Learn how different faith traditions approach the search for meaning and purpose in life's journey.",
    image: "/spiritual-journey-mountain-path.jpg",
    category: "Spirituality",
    date: "January 5, 2025",
    readTime: "6 min read",
  },
]

export function BlogPreviewSection() {
  return (
    <section className="border-b border-border py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Latest from Our Blog
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Insights, reflections, and guidance on faith and spirituality
              </p>
            </div>
            <Button asChild variant="outline" className="hidden md:inline-flex bg-transparent">
              <Link href="/blog">View All Posts</Link>
            </Button>
          </div>

          {/* Blog Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, index) => (
              <Card
                key={index}
                className="group overflow-hidden border border-border bg-card transition-all hover:shadow-lg"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      <Tag className="h-3 w-3" />
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
                  <Button asChild variant="link" className="p-0 h-auto font-semibold">
                    <Link href="/blog">Read More</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button asChild variant="outline">
              <Link href="/blog">View All Posts</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
