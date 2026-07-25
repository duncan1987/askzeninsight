'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('cancelSubscription')

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
        if (response.status === 403) {
          alert(data.error + '\n\n' + data.message)
          setLoading(false)
          setShowConfirm(false)
          return
        }

        throw new Error(data.error || t('failedToCancel'))
      }

      const { keepProAccess, immediateCancellation, reviewPeriod } = data

      if (keepProAccess) {
        alert(
          data.message + '\n\n' + t('proAccessRemains') + '\n' + t('reviewPeriod', { period: reviewPeriod }) + '\n' + t('emailNotification')
        )
      } else if (immediateCancellation) {
        alert(
          data.message + '\n\n' + t('nowFreeTier') + '\n' + t('chatModel') + '\n' + t('historyNotSaved')
        )
      } else {
        alert(data.message)
      }

      window.location.reload()
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      alert(
        error instanceof Error
          ? error.message
          : t('failedToCancel')
      )
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    const periodEnd = currentPeriodEnd
      ? new Date(currentPeriodEnd).toLocaleDateString()
      : t('endOfBillingPeriod')

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
              {t('cancelling')}
            </>
          ) : (
            t('confirmCancel')
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
          {t('keepSubscription')}
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
      {t('cancelSubscription')}
    </Button>
  )
}
