"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2, RefreshCw } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface Subscription {
  id: string
  user_id: string
  plan: string
  refund_amount: number
  refund_estimated_at: string
  refund_notes: string | null
  created_at: string
  userEmail?: string
  userName?: string
}

export default function RefundReviewPage() {
  const { adminKey } = useAdminAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchSubscriptions = async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/refund-review?status=requested`, {
        headers: { "x-admin-key": adminKey },
      })
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (subscriptionId: string, action: "approve" | "reject", notes?: string) => {
    if (!adminKey) return
    setProcessing(subscriptionId)
    try {
      const response = await fetch("/api/admin/refund-review", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ subscriptionId, action, notes }),
      })
      if (response.ok) {
        const data = await response.json()
        alert(`${action === "approve" ? "✓ Refund approved" : "✕ Refund rejected"}: ${data.message}`)
        fetchSubscriptions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch {
      alert("Failed to process review. Please try again.")
    } finally {
      setProcessing(null)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [adminKey])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">退款审核</h1>
      <p className="text-muted-foreground mb-6">管理订阅取消和退款请求</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="text-3xl font-bold text-blue-900">{subscriptions.length}</div>
          <div className="text-sm text-blue-700">待处理退款</div>
        </Card>
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="text-3xl font-bold text-green-900">
            ${subscriptions.reduce((sum, s) => sum + (s.refund_amount || 0), 0).toFixed(2)}
          </div>
          <div className="text-sm text-green-700">待退款总额</div>
        </Card>
        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="text-3xl font-bold text-amber-900">{subscriptions.filter((s) => s.plan === "annual").length}</div>
          <div className="text-sm text-amber-700">年付计划</div>
        </Card>
      </div>

      <div className="mb-6 flex gap-4">
        <Button onClick={fetchSubscriptions} disabled={loading} variant="outline">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          刷新
        </Button>
      </div>

      {loading && subscriptions.length === 0 ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </Card>
      ) : subscriptions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">没有待处理的退款请求 🎉</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-lg font-semibold">{subscription.userName || "Unknown User"}</h3>
                    <span className="text-sm text-muted-foreground">{subscription.userEmail}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        subscription.plan === "annual" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {subscription.plan === "annual" ? "Annual" : "Monthly"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-muted-foreground">退款金额</div>
                      <div className="font-semibold text-green-600">${subscription.refund_amount?.toFixed(2) || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">申请时间</div>
                      <div className="font-medium">{new Date(subscription.refund_estimated_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">订阅时间</div>
                      <div className="font-medium">{new Date(subscription.created_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">订阅ID</div>
                      <div className="font-mono text-xs">{subscription.id.slice(0, 8)}...</div>
                    </div>
                  </div>

                  {subscription.refund_notes && (
                    <div className="bg-muted p-3 rounded mb-4">
                      <div className="text-xs text-muted-foreground mb-1">用户备注:</div>
                      <div className="text-sm">{subscription.refund_notes}</div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => {
                      const action = confirm(`批准退款 $${subscription.refund_amount?.toFixed(2)}？`) ? "approve" as const : null
                      if (!action) {
                        if (confirm("拒绝此退款？")) {
                          const notes = prompt("添加备注（可选）:")
                          if (notes !== null) handleReview(subscription.id, "reject", notes || undefined)
                        }
                        return
                      }
                      const notes = prompt("添加备注（可选）:")
                      if (notes !== null) handleReview(subscription.id, action, notes || undefined)
                    }}
                    disabled={processing === subscription.id}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === subscription.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        审核
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
