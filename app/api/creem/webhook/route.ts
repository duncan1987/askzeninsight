import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCreemWebhook } from '@/lib/creem'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('x-creem-signature') || headers().get('creem-signature')

    // Verify webhook signature
    if (!signature || !verifyCreemWebhook(body, signature, process.env.CREEM_WEBHOOK_SECRET!)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'payment.succeeded':
      case 'subscription.created': {
        const { user_id, user_email, subscription_id, status } = event.data

        // Create or update subscription in database
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user_id,
            creem_subscription_id: subscription_id,
            status: status || 'active',
            current_period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days from now
            ).toISOString(),
          })

        if (error) throw error
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const { subscription_id } = event.data

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
          })
          .eq('creem_subscription_id', subscription_id)

        if (error) throw error
        break
      }

      case 'payment.failed': {
        const { user_id } = event.data

        // Update subscription status to past_due
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('user_id', user_id)

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
