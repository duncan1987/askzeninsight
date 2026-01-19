'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CancelSubscriptionButtonProps {
  subscriptionId?: string
  currentPeriodEnd?: string
  isCancelled?: boolean
  hoursSinceSubscription?: number
}

export function CancelSubscriptionButton({
  subscriptionId,
  currentPeriodEnd,
  isCancelled = false,
  hoursSinceSubscription = 0,
}: CancelSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  // Don't show cancel button if already cancelled
  if (isCancelled) {
    return null
  }

  // Check if eligible for refund (within 48 hours)
  const isRefundEligible = hoursSinceSubscription <= 48

  const handleCancel = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle 403 Forbidden (past 7 days)
        if (response.status === 403) {
          let errorMsg = data.error || 'Cannot cancel subscription'
          if (data.message) {
            errorMsg += '\n\n' + data.message
          }
          if (data.policyUrl) {
            errorMsg += '\n\nPlease review our refund policy: ' + data.policyUrl
          }
          if (data.canContactSupport) {
            errorMsg += '\n\nIf you have exceptional circumstances, please contact us at support@zeninsight.xyz'
          }
          alert(errorMsg)
          setLoading(false)
          setShowConfirm(false)
          return
        }

        // Build detailed error message
        let errorMsg = data.error || 'Failed to cancel subscription'
        if (data.details) {
          errorMsg += '\n\nPossible reasons:\n' + (
            Array.isArray(data.details.possible_causes)
              ? data.details.possible_causes.map((c: string) => '• ' + c).join('\n')
              : data.details.hint || ''
          )
        }
        throw new Error(errorMsg)
      }

      // Handle success response
      if (data.success) {
        // Handle immediate cancellation (≤5 messages, fully refundable)
        if (data.immediateCancellation && data.fullyRefundable) {
          alert(data.message)
          // Refresh to show free tier
          setLoading(false)
          setShowConfirm(false)
          router.refresh()
          return
        }

        // Handle scheduled cancellation with refund info (>5 messages or 48h-7d)
        let message = data.message
        if (data.refundInfo) {
          message += '\n\n' + 'Refund Information:'
          message += '\n• Messages used: ' + data.refundInfo.usageCount
          message += '\n• Estimated refund: ' + data.refundInfo.estimatedRefund
          message += '\n• Refund percentage: ' + data.refundInfo.refundPercentage
          message += '\n\nSince you used more than 5 messages within 48 hours, please contact us at ' + data.supportEmail + ' to process your refund.'
          message += '\n\nMention your subscription ID and we will calculate your exact refund amount.'
        } else if (isRefundEligible) {
          // Within 48h but refundInfo not calculated (shouldn't happen, but handle it)
          message += '\n\nSince you cancelled within 48 hours of subscription, you may be eligible for a refund.'
          message += '\n\nPlease contact support@zeninsight.xyz to request your refund.'
        } else {
          // 48h-7d: contact support for review
          message += '\n\nIf you would like to request a refund, please contact us at support@zeninsight.xyz for review.'
        }
        alert(message)
        // Reset loading state before refresh
        setLoading(false)
        setShowConfirm(false)
        // Refresh the page to show updated status
        router.refresh()
        return
      }

      // Refresh the page to show updated status
      setLoading(false)
      setShowConfirm(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to cancel subscription. Please try again or contact support.'
      )
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    const periodEnd = currentPeriodEnd
      ? new Date(currentPeriodEnd).toLocaleDateString()
      : 'the end of your billing period'

    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cancelling...
            </>
          ) : (
            'Confirm Cancel'
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowConfirm(false)
            setLoading(false)
          }}
          disabled={loading}
        >
          Keep Subscription
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowConfirm(true)}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      Cancel Subscription
    </Button>
  )
}
