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
        // Build success message
        let message = data.message
        if (isRefundEligible) {
          message += '\n\nSince you cancelled within 48 hours of subscription, you may be eligible for a full refund.'
          message += '\n\nPlease contact support@zeninsight.xyz to request your refund.'
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
