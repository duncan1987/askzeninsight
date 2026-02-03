'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CancelSubscriptionButtonProps {
  subscriptionId?: string
  currentPeriodEnd?: string
  isCancelled?: boolean
}

export function CancelSubscriptionButton({
  subscriptionId,
  currentPeriodEnd,
  isCancelled = false,
}: CancelSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  // Don't show cancel button if already cancelled
  if (isCancelled) {
    return null
  }

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
          alert(data.error + '\n\n' + data.message)
          setLoading(false)
          setShowConfirm(false)
          return
        }

        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Handle success - all cancellations are now immediate
      alert(data.message + '\n\n• You are now on the free tier (10 messages/day)\n• Chat model: glm-4-flash\n• Chat history will no longer be saved')

      // Refresh the entire page to update all components including UsageMeter
      window.location.reload()
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
