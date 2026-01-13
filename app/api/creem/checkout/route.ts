import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
      plan: 'pro'
    }>

    if (body.plan !== 'pro') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Prefer API-based checkout so we can attach metadata for webhooks.
    const proProductId = process.env.CREEM_PRO_PRODUCT_ID
    if (proProductId) {
      const checkout = await createCreemCheckout({
        productId: proProductId,
        requestId: user.id,
        customerEmail: user.email || undefined,
        successUrl: `${siteUrl}/dashboard?payment=success`,
        metadata: {
          referenceId: user.id,
          userEmail: user.email || undefined,
        },
      })

      return NextResponse.json({ checkout_url: checkout.checkout_url })
    }

    // Fallback to a static payment link (may not include metadata in webhooks).
    const url = generatePaymentLink('pro', user.id, user.email || undefined)
    return NextResponse.json({ checkout_url: url })
  } catch (error) {
    console.error('Creem checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    )
  }
}

