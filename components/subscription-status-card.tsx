'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BillingPortalButton } from './billing-portal-button'
import { CancelSubscriptionButton } from './cancel-subscription-button'
import { AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('subscription')
  const now = new Date()
  const createdAt = new Date(subscription.created_at)
  const periodEnd = new Date(subscription.current_period_end)

  const hoursSinceSubscription = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
  const daysUntilRenewal = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const isWithinRefundWindow = hoursSinceSubscription <= 48
  const isLowUsage = usageCount <= 5
  const eligibleForRefund = isWithinRefundWindow && isLowUsage && subscription.status === 'active'

  const isCancelled = subscription.status === 'cancelled' ||
                      subscription.status === 'canceled' ||
                      subscription.cancel_at_period_end === true

  const currentPlan = subscription.plan || 'pro'
  const isAnnual = currentPlan === 'annual' || subscription.interval === 'year'

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCancelled ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{t('cancelled')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('cancelledDesc')}
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-sm font-medium">
                {t('freeTier')}
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
                  <li><strong>{t('tenMessages')}</strong> {t('insteadOf30')}</li>
                  <li><strong>{t('basicModel')}</strong> {t('glm4flashInstead')}</li>
                  <li><strong>{t('noHistory')}</strong> {t('conversationsNotSaved')}</li>
                </ul>
                {eligibleForRefund && (
                  <p className="text-foreground font-medium pt-2">
                    {t('refundEligible')}{' '}
                    <Link href="/refund" className="underline underline-offset-4">
                      {t('viewRefundPolicy')}
                    </Link>{' '}
                    {t('orContactSupport')}
                  </p>
                )}
                {!eligibleForRefund && (
                  <p className="pt-2">
                    {t('wantToRestore')}{' '}
                    <Link href="/pricing" className="underline underline-offset-4 font-medium">
                      {t('subscribeAgain')}
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
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {subscription.plan === 'annual' || subscription.interval === 'year'
                    ? t('annualActive')
                    : t('monthlyActive')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {daysUntilRenewal > 0 ? t('renewsIn', { days: daysUntilRenewal }) : t('renewsLessThanDay')} (
                  {new Date(subscription.current_period_end).toLocaleDateString()})
                </p>
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {t('active')}
              </span>
            </div>

            {daysUntilRenewal <= 7 && daysUntilRenewal > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    {daysUntilRenewal === 1 ? t('expiresTomorrow') :
                     daysUntilRenewal === 7 ? t('expiresIn7') :
                     t('expiresIn', { days: daysUntilRenewal })}
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    {t('expiresOn', { date: periodEnd.toLocaleDateString() })}
                  </p>
                  <Button size="sm" variant="outline" className="mt-2" asChild>
                    <Link href="/pricing">{t('renewNow')}</Link>
                  </Button>
                </div>
              </div>
            )}

            {eligibleForRefund && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {t('refundEligible')}
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    {t('refundEligibleDesc')}
                  </p>
                  <Link
                    href="/refund"
                    className="text-blue-600 dark:text-blue-400 underline underline-offset-4 text-xs"
                  >
                    {t('viewRefundPolicyArrow')}
                  </Link>
                </div>
              </div>
            )}

            {!eligibleForRefund && (
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    {t('cancelImmediateDesc')}
                  </p>
                  <p>
                    <Link href="/refund" className="underline underline-offset-4">
                      {t('refundPolicyLink')}
                    </Link>
                    {' '}• {t('cancellations7days')}
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
              {t('questions')}{' '}
              <Link
                href="/refund"
                className="underline underline-offset-4"
              >
                {t('refundPolicyLink')}
              </Link>
              {' '}{t('or')}{' '}
              <a className="underline underline-offset-4" href="mailto:support@zeninsight.xyz">
                {t('contactSupport')}
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
