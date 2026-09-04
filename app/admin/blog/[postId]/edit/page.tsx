"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"
import { Loader2, ArrowLeft, Save, Send } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { value: "meditation", label: "冥想" },
  { value: "zen-philosophy", label: "禅哲学" },
  { value: "mindfulness", label: "正念" },
  { value: "spiritual-growth", label: "心灵成长" },
  { value: "practice-guide", label: "修行指南" },
]

const LOCALE_OPTIONS = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "both", label: "中/英" },
]

interface BlogPost {
  id: string
  title: string
  slug: string
  description: string
  content_html: string
  cover_image: string | null
  cover_image_alt: string
  category: string
  tags: string[]
  author: string
  is_published: boolean
  source_course_id: string | null
  locale: string
  published_at: string | null
}

export default function EditBlogPage() {
  const { adminKey } = useAdminAuth()
  const router = useRouter()
  const params = useParams()
  const postId = params.postId as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [contentHtml, setContentHtml] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [category, setCategory] = useState("meditation")
  const [tagsInput, setTagsInput] = useState("")
  const [locale, setLocale] = useState("zh")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!adminKey || !postId) return
    fetch(`/api/admin/blog/posts/${postId}`, {
      headers: { "x-admin-key": adminKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.post) {
          const p = data.post as BlogPost
          setPost(p)
          setTitle(p.title)
          setSlug(p.slug)
          setDescription(p.description || "")
          setContentHtml(p.content_html)
          setCoverImage(p.cover_image || "")
          setCategory(p.category || "meditation")
          setTagsInput((p.tags || []).join(", "))
          setLocale(p.locale || "zh")
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [adminKey, postId])

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !slug.trim() || !contentHtml.trim()) {
      alert("标题、slug 和内容为必填项")
      return
    }
    setSaving(true)
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const res = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description,
          content_html: contentHtml,
          cover_image: coverImage || null,
          category,
          tags,
          locale,
          is_published: publish || post?.is_published || false,
        }),
      })
      if (res.ok) {
        router.push("/admin/blog")
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
          <Link href="/admin/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">编辑博客文章</h1>
          {post?.is_published && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">已发布</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            保存
          </Button>
          {!post?.is_published && (
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
              <label className="text-sm font-medium mb-1 block">标题 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">语言</label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {LOCALE_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">标签（逗号分隔）</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">封面图片 URL</label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">文章内容</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={contentHtml}
              onChange={setContentHtml}
              showTruncationLine={false}
              placeholder="编辑博客内容..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
