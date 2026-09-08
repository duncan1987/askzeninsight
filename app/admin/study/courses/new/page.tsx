"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import { getTruncationIndex } from "@/components/editor/truncation-line-extension"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"
import { Loader2, ArrowLeft, Save, Send } from "lucide-react"
import Link from "next/link"

export default function NewCoursePage() {
  const { adminKey } = useAdminAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [contentHtml, setContentHtml] = useState("")
  const [sortOrder, setSortOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      alert("请输入课程标题")
      return
    }
    setSaving(true)
    try {
      const truncationIndex = getTruncationIndex(contentHtml)
      const res = await fetch("/api/admin/study/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          title: title.trim(),
          content_html: contentHtml,
          truncation_index: truncationIndex,
          sort_order: sortOrder,
          is_published: publish,
        }),
      })
      if (res.ok) {
        // 不解析响应体，避免响应被网络截断时误报保存失败
        router.push("/admin/study/courses")
      } else {
        const err = await res.json().catch(() => ({ error: '响应格式错误' }))
        alert(`保存失败 (HTTP ${res.status}): ${err.error}`)
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        alert("网络波动导致响应不完整——课程很可能已保存，请返回课程列表确认，勿直接重复提交（可能造成重复课程）。")
      } else {
        alert(`保存失败（网络错误）: ${e instanceof Error ? e.message : '无法连接服务器，请检查网络后重试'}`)
      }
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-2xl font-bold">新建课程</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            保存草稿
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            发布
          </Button>
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
                placeholder="输入课程标题"
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
              placeholder="开始编写课程内容...使用 ✂ 按钮插入截断线"
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
