"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Trash2, FileText, BookOpen, Library } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface KbDocument {
  id: string
  title: string
  source: string
  source_id: string | null
  filename: string | null
  page_count: number | null
  char_count: number | null
  chunk_count: number
  created_at: string
}

export default function AdminKbPage() {
  const { adminKey } = useAdminAuth()
  const [documents, setDocuments] = useState<KbDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/kb/documents", {
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (e) {
      console.error("Failed to fetch KB documents:", e)
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      alert("请选择 PDF 文件")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      if (title.trim()) formData.append("title", title.trim())

      const res = await fetch("/api/admin/kb/upload", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: formData,
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        alert(`已入库「${data.document.title}」：${data.document.chunkCount} 个向量分块`)
        setTitle("")
        if (fileRef.current) fileRef.current.value = ""
        fetchDocuments()
      } else {
        alert(data?.error || `上传失败 (HTTP ${res.status})`)
      }
    } catch {
      alert("上传失败，请检查网络")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: KbDocument) => {
    if (
      !confirm(
        `确定删除「${doc.title}」？其 ${doc.chunk_count} 个向量分块将同步删除，对话中将不再检索到该文档。`
      )
    ) {
      return
    }
    try {
      const res = await fetch(`/api/admin/kb/documents/${doc.id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      } else {
        const err = await res.json().catch(() => null)
        alert(err?.error || "删除失败")
      }
    } catch {
      alert("删除失败，请检查网络")
    }
  }

  const totalChunks = documents.reduce((sum, d) => sum + d.chunk_count, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">知识库管理</h1>
        <p className="text-muted-foreground">
          上传 PDF 与并入的课程，对话 RAG 优先从知识库检索（命中时展示来源文档名）
        </p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium shrink-0">上传 PDF</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文档标题（留空则用文件名）"
            className="flex-1 min-w-[200px] px-3 py-1.5 border rounded-md text-sm bg-background"
          />
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="text-sm"
          />
          <Button size="sm" onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            {uploading ? "解析并向量化中..." : "上传入库"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          仅支持文字版 PDF（扫描件无法提取文字），上限 20MB；入库即向量化，耗时视文档长度而定
        </p>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center">
          <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-1">知识库还是空的</p>
          <p className="text-sm text-muted-foreground">
            上传 PDF，或在课程管理中点击「加入知识库」把课程内容并入
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-sm text-muted-foreground">文档数</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{totalChunks}</div>
              <div className="text-sm text-muted-foreground">向量分块总数</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">
                {documents.filter((d) => d.source === "course").length}
              </div>
              <div className="text-sm text-muted-foreground">并入的课程</div>
            </Card>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {doc.source === "course" ? (
                    <BookOpen className="h-5 w-5 mt-0.5 text-blue-600 shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 mt-0.5 text-emerald-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{doc.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          doc.source === "course"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {doc.source === "course" ? "课程并入" : "PDF 上传"}
                      </span>
                      {doc.page_count != null && <span>{doc.page_count} 页</span>}
                      {doc.char_count != null && <span>{doc.char_count} 字</span>}
                      <span>{doc.chunk_count} 个向量分块</span>
                      <span>入库于 {new Date(doc.created_at).toLocaleDateString("zh-CN")}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 shrink-0"
                  onClick={() => handleDelete(doc)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
