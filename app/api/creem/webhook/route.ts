import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCreemWebhook } from '@/lib/creem'

export const runtime = 'nodejs'

function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  // Creem examples commonly use "YYYY-MM-DD HH:mm:ss" (no timezone); treat as UTC.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed.replace(' ', 'T')}Z`
  }

  const date = new Date(trimmed)
  if (!Number.isFinite(date.getTime())) return null
  return date.toISOString()
}

function getReferenceId(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined
  const record = metadata as Record<string, unknown>

  const candidate =
    record.referenceId ??
    record.reference_id ??
    record.userId ??
    record.user_id

  return typeof candidate === 'string' ? candidate : undefined
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature =
      req.headers.get('creem-signature') ||
      req.headers.get('x-creem-signature')

    // Log incoming webhook for debugging
    console.log('[Creem Webhook] Received webhook')
    console.log('[Creem Webhook] Signature present:', !!signature)
    console.log('[Creem Webhook] Body length:', body.length)

    try {
      const parsedBody = JSON.parse(body)
      console.log('[Creem Webhook] Event type:', parsedBody.eventType || parsedBody.type)
      console.log('[Creem Webhook] Full payload:', JSON.stringify(parsedBody, null, 2))
    } catch {
      console.log('[Creem Webhook] Failed to parse body as JSON')
    }

    // Verify webhook signature
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET
    // Skip signature verification in test mode
    const skipVerification = process.env.NODE_ENV === 'test' ||
                             process.env.CREEM_SKIP_WEBHOOK_VERIFICATION === 'true'

    if (!skipVerification && (!webhookSecret || !signature || !verifyCreemWebhook(body, signature, webhookSecret))) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    const eventType = event.eventType || event.type
    const object = event.object || event.data

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      )
    }

    // Handle different event types
    switch (eventType) {
      // Checkout contains `request_id` and potentially `subscription`.
      case 'checkout.completed': {
        const requestId =
          typeof object?.request_id === 'string'
            ? object.request_id
            : typeof object?.checkout?.request_id === 'string'
              ? object.checkout.request_id
              : undefined

        const subscription = object?.subscription
        const metadata =
          object?.metadata ??
          object?.checkout?.metadata ??
          subscription?.metadata

        const userId = requestId || getReferenceId(metadata)

        const subscriptionId = typeof subscription?.id === 'string' ? subscription.id : undefined

        if (!subscriptionId) break

        // Determine subscription period from metadata or subscription object
        const planType = typeof metadata?.plan === 'string' ? metadata.plan : 'monthly'
        const interval = typeof metadata?.interval === 'string' ? metadata.interval : subscription?.interval

        // Calculate period end based on plan type
        const periodDays =
          interval === 'year' || planType === 'annual'
            ? 365
            : 30

        const currentPeriodEnd =
          toIsoDate(subscription?.current_period_end_date) ||
          toIsoDate(subscription?.next_transaction_date) ||
          new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString()

        if (userId) {
          console.log('[Webhook] Creating subscription:', {
            user_id: userId,
            creem_subscription_id: subscriptionId,
            status: 'active',
            current_period_end: currentPeriodEnd,
            plan: planType === 'annual' ? 'annual' : 'pro',
            interval: interval === 'year' ? 'year' : 'month',
          })

          const { error, data } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                creem_subscription_id: subscriptionId,
                status: 'active',
                current_period_end: currentPeriodEnd,
                plan: planType === 'annual' ? 'annual' : 'pro',
                interval: interval === 'year' ? 'year' : 'month',
              },
              { onConflict: 'creem_subscription_id' }
            )

          console.log('[Webhook] Upsert result:', { error, data })

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_end: currentPeriodEnd,
              plan: planType === 'annual' ? 'annual' : 'pro',
              interval: interval === 'year' ? 'year' : 'month',
            })
            .eq('creem_subscription_id', subscriptionId)
          if (error) throw error
        }
        break
      }

      case 'subscription.paid':
      case 'subscription.active':
      case 'subscription.trialing':
      case 'subscription.update': {
        const subscriptionId = typeof object?.id === 'string' ? object.id : undefined
        if (!subscriptionId) break

        const userId = getReferenceId(object?.metadata)

        // Determine subscription period from metadata or subscription object
        const metadata = object?.metadata
        const planType = typeof metadata?.plan === 'string' ? metadata.plan : 'monthly'
        const interval = typeof metadata?.interval === 'string' ? metadata.interval : object?.interval

        // Calculate period end based on plan type
        const periodDays =
          interval === 'year' || planType === 'annual'
            ? 365
            : 30

        const currentPeriodEnd =
          toIsoDate(object?.current_period_end_date) ||
          toIsoDate(object?.next_transaction_date) ||
          new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString()

        if (userId) {
          const { error } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                creem_subscription_id: subscriptionId,
                status: 'active',
                current_period_end: currentPeriodEnd,
                plan: planType === 'annual' ? 'annual' : 'pro',
                interval: interval === 'year' ? 'year' : 'month',
              },
              { onConflict: 'creem_subscription_id' }
            )
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_end: currentPeriodEnd,
              plan: planType === 'annual' ? 'annual' : 'pro',
              interval: interval === 'year' ? 'year' : 'month',
            })
            .eq('creem_subscription_id', subscriptionId)
          if (error) throw error
        }
        break
      }

      case 'subscription.canceled':
      case 'subscription.cancelled':
      case 'subscription.expired':
      case 'subscription.paused': {
        const subscriptionId = typeof object?.id === 'string' ? object.id : undefined
        if (!subscriptionId) break

        const status =
          eventType === 'subscription.expired'
            ? 'expired'
            : eventType === 'subscription.paused'
              ? 'past_due'
              : 'cancelled'

        const { error } = await supabase
          .from('subscriptions')
          .update({ status })
          .eq('creem_subscription_id', subscriptionId)

        if (error) throw error
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Creem webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
