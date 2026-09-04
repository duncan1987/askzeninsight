"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Lock, Search, MessageCircle, Clock, TrendingUp } from "lucide-react"

type SortType = "default" | "popular" | "newest"

interface Course {
  id: string
  title: string
  truncation_index: number | null
  sort_order: number
  published_at: string | null
  created_at: string
  comment_count: number
  is_checked_in?: boolean
}

interface StudyPageClientProps {
  courses: Course[]
  userId?: string
}

const SORT_OPTIONS: { key: SortType; label: string; icon: typeof TrendingUp }[] = [
  { key: "default", label: "默认排序", icon: Clock },
  { key: "popular", label: "最受欢迎", icon: TrendingUp },
  { key: "newest", label: "最新发布", icon: Clock },
]

export function StudyPageClient({ courses }: StudyPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortType, setSortType] = useState<SortType>("default")

  const filteredAndSorted = useMemo(() => {
    let result = courses

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      result = result.filter((c) => c.title.toLowerCase().includes(query))
    }

    if (sortType === "popular") {
      result = [...result].sort((a, b) => b.comment_count - a.comment_count)
    } else if (sortType === "newest") {
      result = [...result].sort((a, b) => {
        const dateA = a.published_at || a.created_at
        const dateB = b.published_at || b.created_at
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
    }

    return result
  }, [courses, searchQuery, sortType])

  if (courses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">暂无课程，敬请期待</p>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索课程..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-1">
          {SORT_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.key}
                onClick={() => setSortType(opt.key)}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
                  sortType === opt.key
                    ? "bg-amber-100 text-amber-800 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">没有找到匹配的课程</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSorted.map((course, index) => (
            <Card key={course.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-muted-foreground/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {course.published_at
                          ? new Date(course.published_at).toLocaleDateString("zh-CN")
                          : new Date(course.created_at).toLocaleDateString("zh-CN")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {course.comment_count}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {course.is_checked_in ? (
                    <Link href={`/study/${course.id}`}>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer">
                        <Check className="h-4 w-4" />
                        已解锁
                      </span>
                    </Link>
                  ) : (
                    <Link href={`/study/${course.id}`}>
                      <Button variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-50">
                        <Lock className="h-4 w-4 mr-1" />
                        去打卡解锁
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
