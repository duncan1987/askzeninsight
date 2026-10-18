"use client"

import { useCallback, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Trash2, Pencil, BellRing, X } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"
import { cn } from "@/lib/utils"

interface AdminNotification {
  id: string
  title: string
  content: string | null
  type: 'info' | 'warning' | 'success' | 'announcement'
  is_active: boolean
  created_at: string
  expires_at: string | null
}

const TYPE_OPTIONS = [
  { value: 'announcement', label: '📢 功能公告', badgeClass: 'bg-amber-100 text-amber-700' },
  { value: 'info', label: 'ℹ️ 信息', badgeClass: 'bg-blue-100 text-blue-700' },
  { value: 'success', label: '✅ 成功', badgeClass: 'bg-green-100 text-green-700' },
  { value: 'warning', label: '⚠️ 警告', badgeClass: 'bg-red-100 text-red-700' },
] as const

const emptyForm = {
  title: "",
  content: "",
  type: "announcement" as AdminNotification['type'],
  expires_at: "",
  is_active: true,
}

export default function AdminNotificationsPage() {
  const { adminKey } = useAdminAuth()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications", {
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e)
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const startEdit = (n: AdminNotification) => {
    setEditingId(n.id)
    setForm({
      title: n.title,
      content: n.content || "",
      type: n.type,
      expires_at: n.expires_at ? n.expires_at.slice(0, 16) : "",
      is_active: n.is_active,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert("标题不能为空")
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        content: form.content,
        type: form.type,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        ...(editingId ? { is_active: form.is_active } : {}),
      }
      const res = await fetch(
        editingId ? `/api/admin/notifications/${editingId}` : "/api/admin/notifications",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json().catch(() => null)
      if (res.ok) {
        alert(editingId ? "通知已更新" : "通知已发布")
        resetForm()
        fetchNotifications()
      } else {
        alert(data?.error || `保存失败 (HTTP ${res.status})`)
      }
    } catch {
      alert("保存失败，请检查网络")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (n: AdminNotification) => {
    try {
      const res = await fetch(`/api/admin/notifications/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ is_active: !n.is_active }),
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_active: !item.is_active } : item))
        )
      } else {
        const err = await res.json().catch(() => null)
        alert(err?.error || "操作失败")
      }
    } catch {
      alert("操作失败，请检查网络")
    }
  }

  const handleDelete = async (n: AdminNotification) => {
    if (!confirm(`确定删除通知「${n.title}」？`)) return
    try {
      const res = await fetch(`/api/admin/notifications/${n.id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((item) => item.id !== n.id))
        if (editingId === n.id) resetForm()
      } else {
        const err = await res.json().catch(() => null)
        alert(err?.error || "删除失败")
      }
    } catch {
      alert("删除失败，请检查网络")
    }
  }

  const isExpired = (n: AdminNotification) =>
    !!n.expires_at && new Date(n.expires_at) < new Date()

  const statusBadge = (n: AdminNotification) => {
    if (isExpired(n)) return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">已过期</span>
    if (!n.is_active) return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">已停用</span>
    return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">展示中</span>
  }

  const typeOption = (n: AdminNotification) =>
    TYPE_OPTIONS.find((o) => o.value === n.type) || TYPE_OPTIONS[1]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">通知管理</h1>
        <p className="text-muted-foreground">
          管理导航栏铃铛中的系统通知，向用户发布新功能或新内容上线消息
        </p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">{editingId ? "编辑通知" : "发布新通知"}</h2>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4 mr-1" />
              取消编辑
            </Button>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="通知标题（如：新功能上线）"
              className="flex-1 min-w-[240px] px-3 py-1.5 border rounded-md text-sm bg-background"
            />
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AdminNotification['type'] }))}
              className="px-3 py-1.5 border rounded-md text-sm bg-background"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="通知内容（可选，向用户说明详情）"
            rows={3}
            className="w-full px-3 py-1.5 border rounded-md text-sm bg-background resize-y"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground shrink-0">过期时间（可选）</label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              className="px-3 py-1.5 border rounded-md text-sm bg-background"
            />
            {editingId && (
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                启用
              </label>
            )}
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="ml-auto">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {saving ? "保存中..." : editingId ? "保存修改" : "发布通知"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            过期后通知自动从用户铃铛中消失；新建的通知默认立即展示
          </p>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <BellRing className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-1">还没有任何通知</p>
          <p className="text-sm text-muted-foreground">发布第一条通知，告诉用户有哪些新功能上线</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const opt = typeOption(n)
            return (
              <Card key={n.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium truncate">{n.title}</h3>
                    <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium shrink-0", opt.badgeClass)}>
                      {opt.label}
                    </span>
                    {statusBadge(n)}
                  </div>
                  {n.content && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">{n.content}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span>创建于 {new Date(n.created_at).toLocaleString("zh-CN")}</span>
                    {n.expires_at && <span>过期于 {new Date(n.expires_at).toLocaleString("zh-CN")}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(n)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(n)}
                    disabled={isExpired(n)}
                  >
                    {n.is_active ? "停用" : "启用"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(n)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
