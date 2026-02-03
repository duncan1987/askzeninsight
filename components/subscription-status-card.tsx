'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BillingPortalButton } from './billing-portal-button'
import { CancelSubscriptionButton } from './cancel-subscription-button'
import { AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionStatusCardProps {
  subscription: {
    id: string
    creem_subscription_id: string
    status: string
    plan: string
    interval: string
    current_period_end: string
    created_at: string
    cancel_at_period_end?: boolean
  }
  usageCount?: number
}

export function SubscriptionStatusCard({ subscription, usageCount = 0 }: SubscriptionStatusCardProps) {
  const now = new Date()
  const createdAt = new Date(subscription.created_at)
  const periodEnd = new Date(subscription.current_period_end)

  // Calculate hours since subscription
  const hoursSinceSubscription = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
  const daysUntilRenewal = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Check if eligible for refund (≤5 messages within 48 hours)
  const isWithinRefundWindow = hoursSinceSubscription <= 48
  const isLowUsage = usageCount <= 5
  const eligibleForRefund = isWithinRefundWindow && isLowUsage && subscription.status === 'active'

  // Check if subscription is already cancelled or scheduled to cancel
  const isCancelled = subscription.status === 'cancelled' ||
                      subscription.status === 'canceled' ||
                      subscription.cancel_at_period_end === true

  // Determine current plan
  const currentPlan = subscription.plan || 'pro'
  const isAnnual = currentPlan === 'annual' || subscription.interval === 'year'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCancelled ? (
          // Already cancelled - user has been downgraded to free tier immediately
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">Subscription Cancelled</p>
                <p className="text-sm text-muted-foreground">
                  Your account has been downgraded to the free tier.
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-sm font-medium">
                Free Tier
              </span>
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Your subscription has been cancelled and you have been downgraded to the free tier.
                  You can continue using our service with the following limitations:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><strong>10 messages per day</strong> (instead of 30)</li>
                  <li><strong>Basic AI model</strong> (glm-4-flash instead of GLM-4)</li>
                  <li><strong>No chat history</strong> (conversations are not saved)</li>
                </ul>
                {eligibleForRefund && (
                  <p className="text-foreground font-medium pt-2">
                    You may be eligible for a refund.{' '}
                    <Link href="/refund" className="underline underline-offset-4">
                      View refund policy
                    </Link>{' '}
                    or contact support.
                  </p>
                )}
                {!eligibleForRefund && (
                  <p className="pt-2">
                    Want to restore premium features?{' '}
                    <Link href="/pricing" className="underline underline-offset-4 font-medium">
                      Subscribe again
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <BillingPortalButton />
            </div>
          </div>
        ) : (
          // Active subscription
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {subscription.plan === 'annual' || subscription.interval === 'year'
                    ? 'Pro Annual Plan Active'
                    : 'Pro Monthly Plan Active'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Renews in {daysUntilRenewal > 0 ? `${daysUntilRenewal} days` : 'less than a day'} (
                  {new Date(subscription.current_period_end).toLocaleDateString()})
                </p>
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Active
              </span>
            </div>

            {/* Expiry warning banner (7 days or less) */}
            {daysUntilRenewal <= 7 && daysUntilRenewal > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    {daysUntilRenewal === 1 ? 'Expires Tomorrow' :
                     daysUntilRenewal === 7 ? 'Expires in 7 Days' :
                     `Expires in ${daysUntilRenewal} Days`}
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Your subscription expires on {periodEnd.toLocaleDateString()}. Renew now to continue enjoying premium features.
                  </p>
                  <Button size="sm" variant="outline" className="mt-2" asChild>
                    <Link href="/pricing">Renew Now</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Refund eligibility notice */}
            {eligibleForRefund && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Refund Eligible
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Since you subscribed less than 48 hours ago and have used 5 or fewer messages,
                    you&apos;re eligible for a full refund. If you cancel, you will be immediately
                    downgraded to the free tier (10 messages/day, basic AI model).
                  </p>
                  <Link
                    href="/refund"
                    className="text-blue-600 dark:text-blue-400 underline underline-offset-4 text-xs"
                  >
                    View refund policy →
                  </Link>
                </div>
              </div>
            )}

            {/* Cancellation notice */}
            {!eligibleForRefund && (
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Cancellations take effect immediately. Upon cancellation, you will be downgraded
                    to the free tier with 10 messages per day and basic AI model.
                  </p>
                  <p>
                    <Link href="/refund" className="underline underline-offset-4">
                      Refund policy
                    </Link>
                    {' '}• Cancellations must be within 7 days of purchase
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <BillingPortalButton />
                <CancelSubscriptionButton isCancelled={false} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Questions?{' '}
              <Link
                href="/refund"
                className="underline underline-offset-4"
              >
                View refund policy
              </Link>
              {' '}or{' '}
              <a className="underline underline-offset-4" href="mailto:support@zeninsight.xyz">
                contact support
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
