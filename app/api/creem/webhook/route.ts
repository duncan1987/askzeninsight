import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCreemWebhook } from '@/lib/creem'
import { sendWelcomeEmail } from '@/lib/email'

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
          // Check for existing active subscriptions to ensure single active subscription
          const { data: existingSubs } = await supabase
            .from('subscriptions')
            .select('id, status, current_period_end, creem_subscription_id, plan, replaced_by_new_plan')
            .eq('user_id', userId)
            .in('status', ['active', 'cancelled', 'queued'])
            .gte('current_period_end', new Date().toISOString())
            .order('created_at', { ascending: false })

          const currentActiveSub = existingSubs?.find(
            (sub: any) => sub.status === 'active' && !sub.replaced_by_new_plan
          )

          // Determine subscription status and period end based on whether we're queuing
          let subscriptionStatus = 'active'
          let subscriptionPeriodEnd = currentPeriodEnd

          // If there's an active subscription, queue the new one
          if (currentActiveSub && currentActiveSub.creem_subscription_id !== subscriptionId) {
            console.log('[Webhook] Found existing active subscription, queuing new subscription:', currentActiveSub.id)

            // Mark existing as replaced
            await supabase
              .from('subscriptions')
              .update({
                replaced_by_new_plan: true,
                status: 'cancelled',
                cancel_at_period_end: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', currentActiveSub.id)

            // Set new subscription to queued
            subscriptionStatus = 'queued'
            subscriptionPeriodEnd = currentActiveSub.current_period_end

            console.log('[Webhook] Queued new subscription - will activate on:', subscriptionPeriodEnd)
          }

          console.log('[Webhook] Creating subscription:', {
            user_id: userId,
            creem_subscription_id: subscriptionId,
            status: subscriptionStatus,
            current_period_end: subscriptionPeriodEnd,
            plan: planType === 'annual' ? 'annual' : 'pro',
            interval: interval === 'year' ? 'year' : 'month',
          })

          const { error, data } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                creem_subscription_id: subscriptionId,
                status: subscriptionStatus,
                current_period_end: subscriptionPeriodEnd,
                plan: planType === 'annual' ? 'annual' : 'pro',
                interval: interval === 'year' ? 'year' : 'month',
              },
              { onConflict: 'creem_subscription_id' }
            )

          console.log('[Webhook] Upsert result:', { error, data })

          if (error) throw error

          // Send welcome email for new subscriptions
          // Check if this is a new subscription (not an update)
          const isNewSubscription = data && Array.isArray(data) && data.length > 0

          if (isNewSubscription) {
            // Get user email from profiles or metadata
            const userEmail = typeof metadata?.userEmail === 'string'
              ? metadata.userEmail
              : typeof metadata?.user_email === 'string'
                ? metadata.user_email
                : null

            if (userEmail) {
              try {
                await sendWelcomeEmail({
                  userEmail,
                  userName: typeof metadata?.userName === 'string' ? metadata.userName : undefined,
                  plan: planType === 'annual' ? 'annual' : 'pro',
                  currentPeriodEnd,
                  subscriptionId,
                })
                console.log('[Webhook] Welcome email sent successfully')
              } catch (emailError) {
                console.error('[Webhook] Failed to send welcome email:', emailError)
                // Don't throw - email failure shouldn't break the subscription
              }
            } else {
              console.log('[Webhook] No user email found in metadata, skipping welcome email')
            }
          }
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
          // Check for existing active subscriptions to ensure single active subscription
          const { data: existingSubs } = await supabase
            .from('subscriptions')
            .select('id, status, current_period_end, creem_subscription_id, plan, replaced_by_new_plan')
            .eq('user_id', userId)
            .in('status', ['active', 'cancelled', 'queued'])
            .gte('current_period_end', new Date().toISOString())
            .order('created_at', { ascending: false })

          const currentActiveSub = existingSubs?.find(
            (sub: any) => sub.status === 'active' && !sub.replaced_by_new_plan
          )

          // Determine subscription status and period end based on whether we're queuing
          let subscriptionStatus = 'active'
          let subscriptionPeriodEnd = currentPeriodEnd

          // If there's an active subscription, queue the new one
          if (currentActiveSub && currentActiveSub.creem_subscription_id !== subscriptionId) {
            console.log('[Webhook] Found existing active subscription, queuing new subscription:', currentActiveSub.id)

            // Mark existing as replaced
            await supabase
              .from('subscriptions')
              .update({
                replaced_by_new_plan: true,
                status: 'cancelled',
                cancel_at_period_end: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', currentActiveSub.id)

            // Set new subscription to queued
            subscriptionStatus = 'queued'
            subscriptionPeriodEnd = currentActiveSub.current_period_end

            console.log('[Webhook] Queued new subscription - will activate on:', subscriptionPeriodEnd)
          }

          // Check if subscription already exists to determine if this is a new subscription
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id, created_at')
            .eq('creem_subscription_id', subscriptionId)
            .single()

          const isNewSubscription = !existingSub

          const { error } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                creem_subscription_id: subscriptionId,
                status: subscriptionStatus,
                current_period_end: subscriptionPeriodEnd,
                plan: planType === 'annual' ? 'annual' : 'pro',
                interval: interval === 'year' ? 'year' : 'month',
              },
              { onConflict: 'creem_subscription_id' }
            )
          if (error) throw error

          // Send welcome email only for new subscriptions
          if (isNewSubscription) {
            const userEmail = typeof metadata?.userEmail === 'string'
              ? metadata.userEmail
              : typeof metadata?.user_email === 'string'
                ? metadata.user_email
                : null

            if (userEmail) {
              try {
                await sendWelcomeEmail({
                  userEmail,
                  userName: typeof metadata?.userName === 'string' ? metadata.userName : undefined,
                  plan: planType === 'annual' ? 'annual' : 'pro',
                  currentPeriodEnd,
                  subscriptionId,
                })
                console.log('[Webhook] Welcome email sent successfully for subscription.active')
              } catch (emailError) {
                console.error('[Webhook] Failed to send welcome email:', emailError)
                // Don't throw - email failure shouldn't break the subscription
              }
            } else {
              console.log('[Webhook] No user email found in metadata, skipping welcome email')
            }
          }
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
