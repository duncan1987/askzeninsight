"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import { getTruncationIndex } from "@/components/editor/truncation-line-extension"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"
import { Loader2, ArrowLeft, Save, Send } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  content_html: string
  is_published: boolean
  sort_order: number
  truncation_index: number | null
}

export default function EditCoursePage() {
  const { adminKey } = useAdminAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [title, setTitle] = useState("")
  const [contentHtml, setContentHtml] = useState("")
  const [sortOrder, setSortOrder] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!adminKey || !courseId) return
    fetch(`/api/admin/study/courses/${courseId}`, {
      headers: { "x-admin-key": adminKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.course) {
          setCourse(data.course)
          setTitle(data.course.title)
          setContentHtml(data.course.content_html)
          setSortOrder(data.course.sort_order)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [adminKey, courseId])

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      alert("请输入课程标题")
      return
    }
    setSaving(true)
    try {
      const truncationIndex = getTruncationIndex(contentHtml)
      const res = await fetch(`/api/admin/study/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          title: title.trim(),
          content_html: contentHtml,
          truncation_index: truncationIndex,
          sort_order: sortOrder,
          is_published: publish || course?.is_published || false,
        }),
      })
      if (res.ok) {
        router.push("/admin/study/courses")
      } else {
        const err = await res.json()
        alert(`保存失败: ${err.error}`)
      }
    } catch {
      alert("保存失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/study/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">编辑课程</h1>
          {course?.is_published && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">已发布</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            保存
          </Button>
          {!course?.is_published && (
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              发布
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">课程标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">排序序号</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-32 px-4 py-2 border rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">课程内容</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={contentHtml}
              onChange={setContentHtml}
              showTruncationLine={true}
              placeholder="编辑课程内容..."
            />
            <p className="text-xs text-muted-foreground mt-2">
              截断线以上内容对所有人可见，截断线以下内容需打卡后解锁。快捷键: Ctrl+Shift+T
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
