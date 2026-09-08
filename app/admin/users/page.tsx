"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2, RefreshCw, Copy, KeyRound } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface UserProfile {
  id: string
  username: string
  full_name: string
  email: string
  account_status: "pending" | "approved" | "rejected"
  created_at: string
}

interface Stats {
  pending: number
  approved: number
  rejected: number
  total: number
}

interface ResetRequest {
  id: string
  userId: string
  username: string
  token: string
  expiresAt: string
  createdAt: string
}

type TabType = "pending" | "approved" | "rejected" | "resets"

export default function UserReviewPage() {
  const { adminKey } = useAdminAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("pending")
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([])
  const [resetLoading, setResetLoading] = useState(false)

  const fetchUsers = async (status?: string) => {
    if (!adminKey) return
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/user-review?status=${status || activeTab}`, {
        headers: { "x-admin-key": adminKey },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        if (data.stats) setStats(data.stats)
      }
    } catch {
      console.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const fetchResetRequests = useCallback(async () => {
    if (!adminKey) return
    setResetLoading(true)
    try {
      const response = await fetch("/api/admin/password-resets", {
        headers: { "x-admin-key": adminKey },
      })
      if (response.ok) {
        const data = await response.json()
        setResetRequests(data.requests || [])
      }
    } catch {
      console.error("Failed to fetch reset requests")
    } finally {
      setResetLoading(false)
    }
  }, [adminKey])

  const handleReview = async (
    userId: string,
    username: string,
    action: "approve" | "reject",
    notes?: string
  ) => {
    if (!adminKey) return
    setProcessing(userId)
    try {
      const response = await fetch("/api/admin/user-review", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ userId, action, notes }),
      })
      if (response.ok) {
        // 不依赖响应体（本地已有用户名），避免响应被网络截断时误报失败
        alert(`${action === "approve" ? "✓ 已批准" : "✕ 已拒绝"}: ${username}`)
        fetchUsers()
      } else {
        const error = await response.json().catch(() => ({ error: "服务器返回异常响应" }))
        alert(`错误 (HTTP ${response.status}): ${error.error}`)
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        // 请求已到达服务器但响应体被截断 —— 操作大概率已成功
        alert("网络波动导致响应不完整，操作很可能已成功，正在刷新列表确认…")
        fetchUsers()
      } else {
        alert(
          `操作失败（网络错误）: ${e instanceof Error ? e.message : "无法连接服务器"}\n操作可能已成功，请刷新列表确认后再决定是否重试。`
        )
      }
    } finally {
      setProcessing(null)
    }
  }

  const handleGenerateResetLink = async (userId: string, username: string) => {
    if (!adminKey) return
    setProcessing(userId)
    try {
      const response = await fetch("/api/admin/password-resets", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ userId }),
      })
      if (response.ok) {
        const data = await response.json()
        const resetUrl = `${window.location.origin}/auth/reset-password?token=${data.token}`
        await navigator.clipboard.writeText(resetUrl).catch(() => {})
        prompt(`用户 "${username}" 的重置链接（已复制到剪贴板）：`, resetUrl)
        fetchResetRequests()
      } else {
        const error = await response.json().catch(() => ({ error: "服务器返回异常响应" }))
        alert(`错误 (HTTP ${response.status}): ${error.error}`)
      }
    } catch {
      alert("操作失败（网络错误），请重试。")
    } finally {
      setProcessing(null)
    }
  }

  const handleCopyResetLink = async (token: string, username: string) => {
    const resetUrl = `${window.location.origin}/auth/reset-password?token=${token}`
    await navigator.clipboard.writeText(resetUrl).catch(() => {})
    prompt(`用户 "${username}" 的重置链接（已复制到剪贴板）：`, resetUrl)
  }

  useEffect(() => {
    fetchUsers("pending")
  }, [adminKey])

  useEffect(() => {
    if (adminKey) {
      if (activeTab === "resets") {
        fetchResetRequests()
      } else {
        fetchUsers()
      }
    }
  }, [activeTab, adminKey, fetchResetRequests])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isTabLoading = activeTab === "resets" ? resetLoading : loading

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">用户注册审核</h1>
      <p className="text-muted-foreground mb-6">审核中文环境注册用户，批准后可获得无限对话额度</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="text-3xl font-bold text-amber-900">{stats.pending}</div>
          <div className="text-sm text-amber-700">待审核</div>
        </Card>
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
          <div className="text-sm text-green-700">已批准</div>
        </Card>
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-3xl font-bold text-red-900">{stats.rejected}</div>
          <div className="text-sm text-red-700">已拒绝</div>
        </Card>
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-sm text-blue-700">总注册数</div>
        </Card>
      </div>

      <div className="mb-6 flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "resets"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
            >
              {tab === "pending" ? "待审核" : tab === "approved" ? "已批准" : tab === "rejected" ? "已拒绝" : "重置请求"}
            </Button>
          ))}
        </div>
        <Button
          onClick={() => (activeTab === "resets" ? fetchResetRequests() : fetchUsers())}
          disabled={isTabLoading}
          variant="outline"
          size="sm"
        >
          {isTabLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
          刷新
        </Button>
      </div>

      {activeTab === "resets" ? (
        resetLoading && resetRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </Card>
        ) : resetRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">暂无待处理的重置请求</p>
            <p className="text-xs text-muted-foreground mt-2">
              用户在登录页点击“忘记密码”提交后，请求会显示在这里。也可以在“已批准”列表中为用户主动生成重置链接。
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {resetRequests.map((req) => (
              <Card key={req.id} className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <KeyRound className="h-4 w-4 text-amber-600" />
                      <h3 className="text-lg font-semibold">{req.username}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      请求时间：{formatDate(req.createdAt)} · 过期时间：{formatDate(req.expiresAt)}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCopyResetLink(req.token, req.username)}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    复制重置链接
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : loading && users.length === 0 ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {activeTab === "pending" ? "没有待审核的用户" : `没有${activeTab === "approved" ? "已批准" : "已拒绝"}的用户`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-lg font-semibold">{user.username}</h3>
                    <span className="text-sm text-muted-foreground">{user.full_name}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.account_status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : user.account_status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.account_status === "pending"
                        ? "待审核"
                        : user.account_status === "approved"
                        ? "已批准"
                        : "已拒绝"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">邮箱</div>
                      <div className="font-mono text-xs">{user.email}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">注册时间</div>
                      <div className="font-medium">{formatDate(user.created_at)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">用户ID</div>
                      <div className="font-mono text-xs">{user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {user.account_status === "pending" && (
                    <>
                      <Button
                        onClick={() => {
                          const confirmed = confirm(`批准用户 "${user.username}"？批准后将获得无限对话额度。`)
                          if (confirmed) {
                            const notes = prompt("备注（可选）：")
                            if (notes !== null) handleReview(user.id, user.username, "approve", notes || undefined)
                          }
                        }}
                        disabled={processing === user.id}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                        批准
                      </Button>
                      <Button
                        onClick={() => {
                          const confirmed = confirm(`拒绝用户 "${user.username}"？拒绝后该用户名不可重新注册。`)
                          if (confirmed) {
                            const notes = prompt("拒绝原因（可选）：")
                            if (notes !== null) handleReview(user.id, user.username, "reject", notes || undefined)
                          }
                        }}
                        disabled={processing === user.id}
                        size="sm"
                        variant="destructive"
                      >
                        <X className="h-4 w-4 mr-1" />
                        拒绝
                      </Button>
                    </>
                  )}

                  {user.account_status === "approved" && (
                    <Button
                      onClick={() => handleGenerateResetLink(user.id, user.username)}
                      disabled={processing === user.id}
                      size="sm"
                      variant="outline"
                    >
                      {processing === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4 mr-1" />
                      )}
                      生成重置链接
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
