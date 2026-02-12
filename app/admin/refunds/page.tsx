"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"

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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [adminKey, setAdminKey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Fetch pending refund requests
  const fetchSubscriptions = async () => {
    if (!adminKey) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/refund-review?status=requested`, {
        headers: {
          'x-admin-key': adminKey,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
      alert('Failed to fetch subscriptions. Make sure your admin key is correct.')
    } finally {
      setLoading(false)
    }
  }

  // Handle refund review decision
  const handleReview = async (subscriptionId: string, action: 'approve' | 'reject', notes?: string) => {
    if (!adminKey) {
      alert('Please enter your admin key first')
      return
    }

    setProcessing(subscriptionId)
    try {
      const response = await fetch('/api/admin/refund-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          subscriptionId,
          action,
          notes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${action === 'approve' ? '✓ Refund approved' : '✕ Refund rejected'}: ${data.message}`)
        // Refresh the list
        fetchSubscriptions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to process review:', error)
      alert('Failed to process review. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const handleSubmitReview = (subscription: Subscription) => {
    const action = confirm(`Approve refund of $${subscription.refund_amount?.toFixed(2)}?`)
      ? 'approve' as const
      : 'reject' as const

    if (action === 'reject') {
      const confirmed = confirm('Are you sure you want to reject this refund?')
      if (!confirmed) return
    }

    const notes = prompt('Add notes (optional):')
    if (notes !== null) {
      handleReview(subscription.id, action, notes || undefined)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Review Dashboard</h1>
          <p className="text-gray-600">Manage subscription cancellation and refund requests</p>
        </div>

        {/* Admin Authentication */}
        {!isAuthenticated ? (
          <Card className="p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Admin Authentication</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter your admin key to access the refund review dashboard.
            </p>
            <input
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && adminKey) {
                  setIsAuthenticated(true)
                  fetchSubscriptions()
                }
              }}
            />
            <Button
              onClick={() => {
                if (adminKey) {
                  setIsAuthenticated(true)
                  fetchSubscriptions()
                }
              }}
              disabled={!adminKey}
              className="w-full"
            >
              Authenticate
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="text-3xl font-bold text-blue-900">{subscriptions.length}</div>
                <div className="text-sm text-blue-700">Pending Reviews</div>
              </Card>
              <Card className="p-6 bg-green-50 border-green-200">
                <div className="text-3xl font-bold text-green-900">
                  ${subscriptions.reduce((sum, s) => sum + (s.refund_amount || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm text-green-700">Total Pending Refunds</div>
              </Card>
              <Card className="p-6 bg-amber-50 border-amber-200">
                <div className="text-3xl font-bold text-amber-900">{subscriptions.filter(s => s.plan === 'annual').length}</div>
                <div className="text-sm text-amber-700">Annual Plans</div>
              </Card>
            </div>

            {/* Refresh Button */}
            <div className="mb-6 flex gap-4">
              <Button onClick={fetchSubscriptions} disabled={loading} variant="outline">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Refresh
              </Button>
              <Button onClick={() => { setIsAuthenticated(false); setAdminKey('') }} variant="ghost">
                Logout
              </Button>
            </div>

            {/* Subscriptions List */}
            {loading && subscriptions.length === 0 ? (
              <Card className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading refund requests...</p>
              </Card>
            ) : subscriptions.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-600">No pending refund requests 🎉</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <Card key={subscription.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-lg font-semibold">{subscription.userName || 'Unknown User'}</h3>
                          <span className="text-sm text-gray-500">{subscription.userEmail}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            subscription.plan === 'annual'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {subscription.plan === 'annual' ? 'Annual' : 'Monthly'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <div className="text-gray-500">Refund Amount</div>
                            <div className="font-semibold text-green-600">
                              ${subscription.refund_amount?.toFixed(2) || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Requested</div>
                            <div className="font-medium">
                              {new Date(subscription.refund_estimated_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Subscribed</div>
                            <div className="font-medium">
                              {new Date(subscription.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Subscription ID</div>
                            <div className="font-mono text-xs">
                              {subscription.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>

                        {subscription.refund_notes && (
                          <div className="bg-gray-50 p-3 rounded mb-4">
                            <div className="text-xs text-gray-500 mb-1">Notes from user:</div>
                            <div className="text-sm">{subscription.refund_notes}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleSubmitReview(subscription)}
                          disabled={processing === subscription.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processing === subscription.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Review
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
