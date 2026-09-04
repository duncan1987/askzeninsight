"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface Comment {
  id: string
  content: string
  created_at: string
  course_id: string
  course_title: string
  user_id: string
  username: string
}

export default function AdminCommentsPage() {
  const { adminKey } = useAdminAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchComments = async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/study/comments", {
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (e) {
      console.error("Failed to fetch comments:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("确定删除此评论？")) return
    setDeleting(commentId)
    try {
      const res = await fetch(`/api/admin/study/comments/${commentId}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      } else {
        alert("删除失败")
      }
    } catch {
      alert("删除失败")
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [adminKey])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">评论审核</h1>
      <p className="text-muted-foreground mb-6">管理课程评论，删除违规内容</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">暂无评论</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-sm">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString("zh-CN")}
                    </span>
                    <span className="text-xs text-blue-600">
                      《{comment.course_title}》
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 ml-4"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleting === comment.id}
                >
                  {deleting === comment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
