"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, FileText, Globe, EyeOff } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface BlogPost {
  id: string
  title: string
  slug: string
  category: string
  is_published: boolean
  locale: string
  published_at: string | null
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  meditation: "冥想",
  "zen-philosophy": "禅哲学",
  mindfulness: "正念",
  "spiritual-growth": "心灵成长",
  "practice-guide": "修行指南",
}

export default function AdminBlogPage() {
  const { adminKey } = useAdminAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/blog/posts", {
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (e) {
      console.error("Failed to fetch blog posts:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此博客文章？此操作不可撤销。")) return
    try {
      const res = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) fetchPosts()
      else alert("删除失败")
    } catch {
      alert("删除失败")
    }
  }

  const handlePublish = async (id: string, currentPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/blog/posts/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ publish: !currentPublished }),
      })
      if (res.ok) fetchPosts()
      else alert("操作失败")
    } catch {
      alert("操作失败")
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [adminKey])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">博客管理</h1>
          <p className="text-muted-foreground">创建、编辑和管理博客文章</p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建文章
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">还没有博客文章，点击上方按钮创建第一篇</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{post.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      post.is_published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {post.is_published ? "已发布" : "草稿"}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {post.locale === "both" ? "中/英" : post.locale === "en" ? "EN" : "中文"}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                  <span>slug: {post.slug}</span>
                  {post.published_at && (
                    <span>发布于: {new Date(post.published_at).toLocaleDateString("zh-CN")}</span>
                  )}
                  <span>创建: {new Date(post.created_at).toLocaleDateString("zh-CN")}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/blog/${post.id}/edit`}>
                  <Button variant="outline" size="sm">
                    编辑
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePublish(post.id, post.is_published)}
                >
                  {post.is_published ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      取消发布
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-1" />
                      发布
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(post.id)}
                >
                  删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
