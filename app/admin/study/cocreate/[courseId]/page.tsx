"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Check,
  CircleDashed,
  Download,
  FileDown,
  Merge,
  Send,
  Loader2,
} from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface Section {
  id: string
  section_index: number
  title: string
  content_html: string
  claimer_id: string | null
  updated_by: string | null
  updated_at: string
  claimer_name: string | null
  editor_name: string | null
}

interface Course {
  id: string
  title: string
  course_type: string
  cocreate_status: string | null
  cocreate_group_id: string | null
  group_name: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
  content_html: string
}

function isFilled(html: string): boolean {
  if (/<img\s/i.test(html)) return true
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0
}

export default function AdminCocreateManagePage() {
  const { adminKey } = useAdminAuth()
  const params = useParams<{ courseId: string }>()
  const courseId = params?.courseId

  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [merging, setMerging] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/study/cocreate/${courseId}`, {
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        const data = await res.json()
        setCourse(data.course)
        setSections(data.sections || [])
      } else {
        const err = await res.json().catch(() => ({ error: "加载失败" }))
        alert(err.error)
      }
    } catch {
      alert("加载失败")
    } finally {
      setLoading(false)
    }
  }, [adminKey, courseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filledCount = sections.filter((s) => isFilled(s.content_html || "")).length
  const totalCount = sections.length
  const allFilled = totalCount > 0 && filledCount === totalCount
  const progressPercent = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0

  const handleMerge = async () => {
    if (!courseId) return
    if (
      !confirm(
        "确认合并？将按大纲顺序把所有编辑块拼接为完整课程内容（已有合并结果会被覆盖）。"
      )
    )
      return
    setMerging(true)
    try {
      const res = await fetch(`/api/admin/study/cocreate/${courseId}/merge`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        alert(`合并成功：共 ${data.totalSections} 个章节`)
        fetchData()
      } else {
        alert(data.error || "合并失败")
      }
    } catch {
      alert("合并失败")
    } finally {
      setMerging(false)
    }
  }

  const handleExport = async () => {
    if (!courseId) return
    setExporting(true)
    try {
      const res = await fetch(`/api/admin/study/cocreate/${courseId}/export`, {
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${course?.title || "课程"}.docx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } else {
        const err = await res.json().catch(() => ({ error: "导出失败" }))
        alert(err.error)
      }
    } catch {
      alert("导出失败")
    } finally {
      setExporting(false)
    }
  }

  const handlePublish = async () => {
    if (!courseId || !course) return
    if (course.cocreate_status !== "merged") {
      alert("请先合并课程内容，再发布")
      return
    }
    if (!confirm("确认发布？发布后所有用户可见该课程。")) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/study/courses/${courseId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ publish: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        alert("发布成功")
        fetchData()
      } else {
        alert(data.error || "发布失败")
      }
    } catch {
      alert("发布失败")
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!course) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground mb-4">课程不存在或不是共创课程</p>
        <Link href="/admin/study/courses">
          <Button variant="outline" size="sm">
            返回课程列表
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/study/courses">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回课程列表
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">共创课程：{course.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                course.cocreate_status === "merged"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {course.cocreate_status === "merged" ? "已合并" : "共创中"}
            </span>
            {course.is_published && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                已发布
              </span>
            )}
            {course.group_name && <span>用户组：{course.group_name}</span>}
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">编辑进度</span>
          <span className="text-sm text-muted-foreground">
            {filledCount}/{totalCount} 块已完成（{progressPercent}%）
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Sections table */}
      <Card className="mb-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">章节标题</th>
              <th className="px-4 py-3">认领人</th>
              <th className="px-4 py-3">最后编辑</th>
              <th className="px-4 py-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => {
              const filled = isFilled(s.content_html || "")
              return (
                <tr key={s.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 text-muted-foreground">
                    {String(s.section_index + 1).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3 font-medium">{s.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.claimer_name || "（待认领）"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.editor_name ? (
                      <>
                        {s.editor_name}
                        <span className="ml-1 text-xs">
                          {new Date(s.updated_at).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {filled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Check className="h-3 w-3" />
                        已完成
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <CircleDashed className="h-3 w-3" />
                        空块
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleMerge} disabled={!allFilled || merging}>
          {merging ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Merge className="h-4 w-4 mr-1" />
          )}
          合并为完整课程
        </Button>
        {!allFilled && (
          <span className="text-sm text-muted-foreground self-center">
            还差 {totalCount - filledCount} 个编辑块未填充，暂不能合并
          </span>
        )}
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <FileDown className="h-4 w-4 mr-1" />
          )}
          导出 Word
        </Button>
        {!course.is_published ? (
          <Button
            variant="outline"
            onClick={handlePublish}
            disabled={publishing || course.cocreate_status !== "merged"}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            发布课程
          </Button>
        ) : (
          <Link href={`/study/${courseId}`} target="_blank">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1 rotate-180" />
              查看课程页
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
