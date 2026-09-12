"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  FileDown,
  Loader2,
  Merge,
  UserCheck,
} from "lucide-react"

export interface CoCourseSection {
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

interface CoCourse {
  id: string
  title: string
  cocreate_status: string | null
  is_published: boolean
}

interface CocourseClientProps {
  course: CoCourse
  sections: CoCourseSection[]
  userId: string | null
}

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error"

function isFilled(html: string): boolean {
  if (!html) return false
  if (/<img\s/i.test(html)) return true
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function CocourseClient({ course, sections: initialSections, userId }: CocourseClientProps) {
  const [sections, setSections] = useState<CoCourseSection[]>(initialSections)
  const [courseStatus, setCourseStatus] = useState<string | null>(course.cocreate_status)
  const [merging, setMerging] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const firstUnfilled = initialSections.find((s) => !isFilled(s.content_html))
  const [expandedId, setExpandedId] = useState<string | null>(
    firstUnfilled?.id ?? initialSections[0]?.id ?? null
  )

  const filledCount = useMemo(
    () => sections.filter((s) => isFilled(s.content_html)).length,
    [sections]
  )
  const totalCount = sections.length
  const allFilled = totalCount > 0 && filledCount === totalCount
  const progressPercent = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0

  // Warn before leaving with unsaved edits
  const dirtyRef = useRef(false)
  const markDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty
  }, [])
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  const handleSectionSaved = useCallback(
    (sectionId: string, contentHtml: string, updatedAt: string) => {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, content_html: contentHtml, updated_by: userId, updated_at: updatedAt, editor_name: "我" }
            : s
        )
      )
    },
    [userId]
  )

  const handleClaim = async (sectionId: string) => {
    setClaimingId(sectionId)
    try {
      const res = await fetch(`/api/study/sections/${sectionId}/claim`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, claimer_id: data.section.claimer_id, claimer_name: "我" } : s
          )
        )
      } else {
        const err = await res.json().catch(() => ({ error: "认领失败" }))
        alert(err.error || "认领失败")
        // Refresh section state in case someone else claimed it first
        window.location.reload()
      }
    } catch {
      alert("认领失败，请检查网络")
    } finally {
      setClaimingId(null)
    }
  }

  const handleMerge = async () => {
    if (!allFilled) return
    if (
      !confirm(
        "确认合并？将按大纲顺序把所有编辑块拼接为完整课程（已有合并结果会被覆盖）。合并后仍可继续编辑并重新合并。"
      )
    )
      return
    setMerging(true)
    try {
      const res = await fetch(`/api/study/cocreate/${course.id}/merge`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setCourseStatus("merged")
        alert("合并成功！课程内容已按大纲顺序生成完整版本。")
      } else {
        alert(data.error || "合并失败")
      }
    } catch {
      alert("合并失败，请检查网络")
    } finally {
      setMerging(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/study/cocreate/${course.id}/export`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${course.title}.docx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } else {
        const err = await res.json().catch(() => ({ error: "导出失败" }))
        alert(err.error || "导出失败")
      }
    } catch {
      alert("导出失败，请检查网络")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <Link href="/study" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        返回课程列表
      </Link>
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              courseStatus === "merged"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {courseStatus === "merged" ? "已合并" : "共创中"}
          </span>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground shrink-0">
            {filledCount}/{totalCount} 块已完成
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const filled = isFilled(section.content_html)
          const expanded = expandedId === section.id
          const claimedByMe = userId != null && section.claimer_id === userId
          return (
            <Card key={section.id} className="overflow-hidden">
              {/* Section header (click to expand/collapse) */}
              <button
                onClick={() => setExpandedId(expanded ? null : section.id)}
                className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {expanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xl font-bold text-muted-foreground/50 shrink-0">
                    {String(section.section_index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{section.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {filled ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Check className="h-3 w-3" />
                          已完成
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-orange-600">
                          <CircleDashed className="h-3 w-3" />
                          待填充
                        </span>
                      )}
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        {claimedByMe ? "我认领" : section.claimer_name || "待认领"}
                      </span>
                      {section.editor_name && (
                        <>
                          <span>·</span>
                          <span>最后编辑 {formatTime(section.updated_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Editor */}
              {expanded && (
                <div className="border-t px-5 pb-5 pt-4">
                  <SectionEditor
                    section={section}
                    claimedByMe={claimedByMe}
                    claiming={claimingId === section.id}
                    onClaim={() => handleClaim(section.id)}
                    onSaved={handleSectionSaved}
                    markDirty={markDirty}
                  />
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mt-8">
        <Button onClick={handleMerge} disabled={!allFilled || merging}>
          {merging ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Merge className="h-4 w-4 mr-1" />
          )}
          合并为完整课程
        </Button>
        {!allFilled && (
          <span className="text-sm text-muted-foreground">
            还有 {totalCount - filledCount} 个编辑块未填充，全部完成后可合并
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
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface SectionEditorProps {
  section: CoCourseSection
  claimedByMe: boolean
  claiming: boolean
  onClaim: () => void
  onSaved: (sectionId: string, contentHtml: string, updatedAt: string) => void
  markDirty: (dirty: boolean) => void
}

const AUTOSAVE_DELAY_MS = 2000

function SectionEditor({ section, claimedByMe, claiming, onClaim, onSaved, markDirty }: SectionEditorProps) {
  const [contentHtml, setContentHtml] = useState(section.content_html)
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const htmlRef = useRef(section.content_html)
  const savingRef = useRef(false)
  const saveRef = useRef<() => void>(() => {})

  const save = useCallback(async () => {
    if (savingRef.current) {
      // Retry shortly instead of dropping the save
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => saveRef.current(), 1000)
      return
    }
    savingRef.current = true
    setStatus("saving")
    try {
      const res = await fetch(`/api/study/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_html: htmlRef.current }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        const updatedAt: string = data?.section?.updated_at || new Date().toISOString()
        setStatus("saved")
        setLastSavedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }))
        markDirty(false)
        onSaved(section.id, htmlRef.current, updatedAt)
      } else {
        const err = await res.json().catch(() => ({ error: "保存失败" }))
        setStatus("error")
        alert(err.error || "保存失败")
      }
    } catch {
      setStatus("error")
    } finally {
      savingRef.current = false
    }
  }, [section.id, onSaved, markDirty])

  saveRef.current = save

  const handleChange = useCallback(
    (html: string) => {
      setContentHtml(html)
      htmlRef.current = html
      setStatus("dirty")
      markDirty(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveRef.current()
      }, AUTOSAVE_DELAY_MS)
    },
    [markDirty]
  )

  // Flush pending edits when the editor unmounts (section collapsed / navigation)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (htmlRef.current !== section.content_html) {
        void saveRef.current()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <TiptapEditor
        content={contentHtml}
        onChange={handleChange}
        showTruncationLine={false}
        placeholder={`填写「${section.title}」的内容...支持富文本与图片`}
      />

      {/* Save status + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-3">
          {!section.claimer_id && (
            <Button variant="outline" size="sm" onClick={onClaim} disabled={claiming}>
              {claiming ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <UserCheck className="h-4 w-4 mr-1" />
              )}
              认领本块
            </Button>
          )}
          {(claimedByMe || section.claimer_id) && (
            <span className="text-xs text-muted-foreground">
              负责人：{claimedByMe ? "我" : section.claimer_name || "—"}
              {!claimedByMe && "（任何成员都可编辑）"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {status === "saving" && (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                保存中...
              </span>
            )}
            {status === "saved" && `已自动保存 · ${lastSavedAt}`}
            {status === "dirty" && "有未保存的修改..."}
            {status === "error" && <span className="text-red-500">保存失败，点击「保存」重试</span>}
            {status === "idle" && "修改后 2 秒自动保存"}
          </span>
          <Button variant="outline" size="sm" onClick={() => saveRef.current()} disabled={status === "saving"}>
            <Check className="h-4 w-4 mr-1" />
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
