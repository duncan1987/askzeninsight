"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface Stats {
  pendingUsers: number
  pendingRefunds: number
  courseCount: number
  commentCount: number
  blogCount: number
  totalCheckins: number
}

export default function AdminOverviewPage() {
  const { adminKey } = useAdminAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!adminKey) return
    setLoading(true)
    fetch("/api/admin/stats", {
      headers: { "x-admin-key": adminKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [adminKey])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const cards = [
    { label: "待审核用户", value: stats.pendingUsers, color: "text-amber-600" },
    { label: "待处理退款", value: stats.pendingRefunds, color: "text-red-600" },
    { label: "已发布课程", value: stats.courseCount, color: "text-blue-600" },
    { label: "评论总数", value: stats.commentCount, color: "text-purple-600" },
    { label: "博客文章", value: stats.blogCount, color: "text-green-600" },
    { label: "总打卡数", value: stats.totalCheckins, color: "text-teal-600" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">后台概览</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-6">
              <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
