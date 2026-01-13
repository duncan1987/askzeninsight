'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface PricingCardProps {
  title: string
  price: string
  period: string
  description: string
  features: string[]
  ctaText: string
  ctaHref: string
  highlighted?: boolean
  creemPlan?: 'pro'
  paymentLink?: string
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

    if (creemPlan) {
      const res = await fetch('/api/creem/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: creemPlan }),
      })

      if (!res.ok) {
        alert('Failed to start checkout. Please try again.')
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
            Most Popular
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

      <Button
        className="w-full"
        variant={highlighted ? 'default' : 'outline'}
        onClick={handleSubscribe}
      >
        {ctaText}
      </Button>
    </Card>
  )
}
