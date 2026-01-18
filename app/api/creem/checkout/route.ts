import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCreemCheckout, generatePaymentLink } from '@/lib/creem'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      )
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as Partial<{
      plan: 'pro' | 'annual'
    }>

    if (!body.plan || (body.plan !== 'pro' && body.plan !== 'annual')) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Check for existing active subscriptions
    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { data: existingSubscriptions, error: subError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'cancelled', 'canceled'])
      .gte('current_period_end', new Date().toISOString())

    if (subError) {
      console.error('[Checkout] Error checking existing subscriptions:', subError)
    }

    // Check if user has an active subscription (not cancelled)
    const activeSubscription = existingSubscriptions?.find(sub =>
      sub.status === 'active' && !sub.cancel_at_period_end
    )

    if (activeSubscription) {
      const currentPlan = activeSubscription.plan || 'pro'
      const requestedPlan = body.plan

      // Check if trying to subscribe to the same plan
      if (currentPlan === requestedPlan) {
        return NextResponse.json(
          {
            error: 'You already have an active subscription to this plan',
            currentPlan,
            message: `You already have an active ${currentPlan === 'annual' ? 'Annual' : 'Pro'} subscription.`,
            hasActiveSubscription: true,
          },
          { status: 409 } // Conflict
        )
      }

      // Check if trying to subscribe to a different plan
      return NextResponse.json(
        {
          error: 'You already have an active subscription to a different plan',
          currentPlan,
          requestedPlan,
          message: `You already have an active ${currentPlan === 'annual' ? 'Annual' : 'Pro'} subscription. Please cancel it first or use the upgrade option in your dashboard.`,
          hasActiveSubscription: true,
          requiresCancellation: true,
        },
        { status: 409 } // Conflict
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Prefer API-based checkout so we can attach metadata for webhooks.
    const proProductId = process.env.CREEM_PRO_PRODUCT_ID
    const annualProductId = process.env.CREEM_ANNUAL_PRODUCT_ID

    const productId = body.plan === 'annual' ? annualProductId : proProductId

    if (productId) {
      console.log(`Creating checkout for ${body.plan} plan using product ID: ${productId}`)
      const checkout = await createCreemCheckout({
        productId,
        requestId: user.id,
        customerEmail: user.email || undefined,
        successUrl: `${siteUrl}/dashboard?payment=success`,
        metadata: {
          referenceId: user.id,
          userEmail: user.email || undefined,
          plan: body.plan,
          interval: body.plan === 'annual' ? 'year' : 'month',
        },
      })

      return NextResponse.json({ checkout_url: checkout.checkout_url })
    }

    // Fallback to a static payment link (may not include metadata in webhooks).
    console.log(`No product ID found for ${body.plan} plan, using static payment link`)
    try {
      const url = generatePaymentLink(body.plan, user.id, user.email || undefined)
      return NextResponse.json({ checkout_url: url })
    } catch (error) {
      console.error(`Failed to generate payment link for ${body.plan}:`, error)
      return NextResponse.json(
        {
          error: `Payment configuration missing for ${body.plan} plan. Please contact support.`,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Creem checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    )
  }
}

