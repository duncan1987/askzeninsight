'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface PricingCardProps {
  title: string
  price: string
  period: string
  description: string
  features: string[]
  ctaText: string
  ctaHref: string
  highlighted?: boolean
  creemPlan?: 'pro' | 'annual'
  paymentLink?: string
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean
  activeSubscription: {
    plan: string
    current_period_end: string
  } | null
  hasCancelledSubscription: boolean
}

export function PricingCard({
  title,
  price,
  period,
  description,
  features,
  ctaText,
  ctaHref,
  highlighted,
  creemPlan,
  paymentLink,
}: PricingCardProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/subscription/check')
      if (res.ok) {
        const data = await res.json()
        setSubscriptionStatus(data)
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    // Check if user is logged in
    const supabase = createClient()
    if (!supabase) {
      alert('Auth is not configured.')
      return
    }
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Redirect to home with sign in
      window.location.href = '/?signin=true'
      return
    }

    // If trying to subscribe but already has active subscription
    if (subscriptionStatus?.hasActiveSubscription) {
      const currentPlan = subscriptionStatus.activeSubscription?.plan

      alert(
        `You currently have an active ${currentPlan === 'annual' ? 'Annual' : 'Monthly'} subscription.\n\n` +
        `To subscribe to a different plan, please:\n` +
        `1. Go to your Dashboard\n` +
        `2. Cancel your current subscription\n` +
        `3. Then subscribe to the new plan\n\n` +
        `You'll continue to have access until your current billing period ends.`
      )
      window.location.href = '/dashboard'
      return
    }

    if (creemPlan) {
      setActionLoading(true)
      const res = await fetch('/api/creem/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: creemPlan }),
      })

      setActionLoading(false)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        if (errorData.error) {
          alert(errorData.error + (errorData.message ? '\n\n' + errorData.message : ''))
        } else {
          alert('Failed to start checkout. Please try again.')
        }
        return
      }

      const data = (await res.json()) as { checkout_url?: string }
      if (!data.checkout_url) {
        alert('Checkout URL missing. Please try again.')
        return
      }

      window.location.href = data.checkout_url
      return
    }

    if (!paymentLink) {
      // For free plan, just navigate
      window.location.href = ctaHref
      return
    }

    // Generate payment link with user info
    const url = new URL(paymentLink)
    url.searchParams.set('user_id', session.user.id)
    url.searchParams.set('user_email', session.user.email || '')

    // Redirect to Creem payment page
    window.location.href = url.toString()
  }

  // Determine button state and text
  const getButtonState = () => {
    if (loading) {
      return {
        disabled: true,
        text: 'Loading...',
        variant: highlighted ? 'default' : 'outline' as const,
      }
    }

    if (!creemPlan) {
      // Free plan
      return {
        disabled: false,
        text: ctaText,
        variant: highlighted ? 'default' : 'outline' as const,
      }
    }

    if (subscriptionStatus?.hasActiveSubscription) {
      // Already has a subscription - go to dashboard
      return {
        disabled: false,
        text: 'Manage Subscription',
        variant: 'secondary' as const,
      }
    }

    // No active subscription
    return {
      disabled: actionLoading,
      text: actionLoading ? 'Processing...' : ctaText,
      variant: highlighted ? 'default' : 'outline' as const,
    }
  }

  const buttonState = getButtonState()
  const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription

  return (
    <Card
      className={cn(
        'p-8 relative',
        highlighted && 'border-primary shadow-lg scale-105'
      )}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            {title}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        <p className="text-muted-foreground mt-3">{description}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Show message if already has any subscription */}
      {hasActiveSubscription && creemPlan && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Active Subscription</p>
            <p className="text-muted-foreground text-xs">
              You already have an active subscription. Go to your dashboard to manage it.
            </p>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        variant={buttonState.variant}
        onClick={handleSubscribe}
        disabled={buttonState.disabled}
      >
        {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonState.text}
      </Button>
    </Card>
  )
}
