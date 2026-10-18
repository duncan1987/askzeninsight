"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  RefreshCw,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  BarChart3,
  type LucideIcon,
} from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface Stats {
  pendingUsers: number
  courseCount: number
  commentCount: number
  blogCount: number
  totalCheckins: number
}

interface StatCardItem {
  label: string
  value: number
  icon: LucideIcon
  chipClass: string
  iconClass: string
  valueClass: string
}

export default function AdminOverviewPage() {
  const { adminKey } = useAdminAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const fetchStats = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      setError("")
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { "x-admin-key": adminKey },
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "请求失败" }))
          setError(body.error || "加载统计数据失败")
          return
        }
        const data = await res.json()
        if (data.stats) {
          setStats(data.stats)
          setUpdatedAt(new Date())
        }
      } catch {
        setError("网络错误，请稍后重试")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [adminKey],
  )

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const cards: StatCardItem[] = stats
    ? [
        {
          label: "待审核用户",
          value: stats.pendingUsers,
          icon: Users,
          chipClass: "bg-amber-50 dark:bg-amber-950/40",
          iconClass: "text-amber-600",
          valueClass: "text-amber-600",
        },
        {
          label: "已发布课程",
          value: stats.courseCount,
          icon: BookOpen,
          chipClass: "bg-blue-50 dark:bg-blue-950/40",
          iconClass: "text-blue-600",
          valueClass: "text-blue-600",
        },
        {
          label: "评论总数",
          value: stats.commentCount,
          icon: MessageSquare,
          chipClass: "bg-purple-50 dark:bg-purple-950/40",
          iconClass: "text-purple-600",
          valueClass: "text-purple-600",
        },
        {
          label: "博客文章",
          value: stats.blogCount,
          icon: FileText,
          chipClass: "bg-green-50 dark:bg-green-950/40",
          iconClass: "text-green-600",
          valueClass: "text-green-600",
        },
        {
          label: "总打卡数",
          value: stats.totalCheckins,
          icon: BarChart3,
          chipClass: "bg-teal-50 dark:bg-teal-950/40",
          iconClass: "text-teal-600",
          valueClass: "text-teal-600",
        },
      ]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">后台概览</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {updatedAt
              ? `数据更新于 ${updatedAt.toLocaleTimeString("zh-CN", { hour12: false })}`
              : "站点核心数据一览"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchStats(true)} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          刷新
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchStats(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {cards.map((c) => (
            <Card key={c.label} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-2xl font-bold tabular-nums ${c.valueClass}`}>{c.value}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">{c.label}</div>
                  </div>
                  <div
                    className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${c.chipClass}`}
                  >
                    <c.icon className={`h-5 w-5 ${c.iconClass}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
