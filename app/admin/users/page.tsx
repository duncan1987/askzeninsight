"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2, RefreshCw } from "lucide-react"
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

export default function UserReviewPage() {
  const { adminKey } = useAdminAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")

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

  const handleReview = async (userId: string, action: "approve" | "reject", notes?: string) => {
    if (!adminKey) return
    setProcessing(userId)
    try {
      const response = await fetch("/api/admin/user-review", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ userId, action, notes }),
      })
      if (response.ok) {
        const data = await response.json()
        alert(`${action === "approve" ? "✓ 已批准" : "✕ 已拒绝"}: ${data.username}`)
        fetchUsers()
      } else {
        const error = await response.json()
        alert(`错误: ${error.error}`)
      }
    } catch {
      alert("操作失败，请重试。")
    } finally {
      setProcessing(null)
    }
  }

  useEffect(() => {
    fetchUsers("pending")
  }, [adminKey])

  useEffect(() => {
    if (adminKey) fetchUsers()
  }, [activeTab])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

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

      <div className="mb-6 flex gap-4 items-center">
        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
            >
              {tab === "pending" ? "待审核" : tab === "approved" ? "已批准" : "已拒绝"}
            </Button>
          ))}
        </div>
        <Button onClick={() => fetchUsers()} disabled={loading} variant="outline" size="sm">
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
          刷新
        </Button>
      </div>

      {loading && users.length === 0 ? (
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

                {user.account_status === "pending" && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => {
                        const confirmed = confirm(`批准用户 "${user.username}"？批准后将获得无限对话额度。`)
                        if (confirmed) {
                          const notes = prompt("备注（可选）：")
                          if (notes !== null) handleReview(user.id, "approve", notes || undefined)
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
                          if (notes !== null) handleReview(user.id, "reject", notes || undefined)
                        }
                      }}
                      disabled={processing === user.id}
                      size="sm"
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      拒绝
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
