"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Tag, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { cn } from "@/lib/utils"

const categories = ["All", "Prayer", "Faith", "Spirituality", "Scripture", "Meditation", "Community"]

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
  {
    title: "Sacred Scripture: A Guide for Daily Living",
    excerpt: "How ancient wisdom from religious texts can provide guidance and insight for contemporary challenges.",
    image: "/open-bible-with-soft-light.jpg",
    category: "Scripture",
    date: "December 28, 2024",
    readTime: "8 min read",
  },
  {
    title: "Meditation Practices Across Faith Traditions",
    excerpt: "Explore different meditation and contemplative practices from various religious and spiritual paths.",
    image: "/peaceful-meditation-zen-garden.jpg",
    category: "Meditation",
    date: "December 22, 2024",
    readTime: "6 min read",
  },
  {
    title: "Building a Spiritual Community in the Digital Age",
    excerpt: "How technology can help us connect with like-minded believers and strengthen our faith communities.",
    image: "/people-gathering-in-warm-light.jpg",
    category: "Community",
    date: "December 15, 2024",
    readTime: "5 min read",
  },
]

export function BlogList() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Spiritual Insights & Guidance
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Explore articles on faith, prayer, and spiritual growth
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(selectedCategory === category ? "bg-primary text-primary-foreground" : "bg-transparent")}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
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
                <p className="text-xs text-muted-foreground">Full posts coming soon.</p>
              </div>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found. Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
  )
}
