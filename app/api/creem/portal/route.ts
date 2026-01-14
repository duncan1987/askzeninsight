import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCreemCustomerPortalLink, getCreemCustomerByEmail } from '@/lib/creem'

export const runtime = 'nodejs'

export async function GET() {
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

    if (!user.email) {
      return NextResponse.json(
        { error: 'Missing email for billing portal' },
        { status: 400 }
      )
    }

    console.log(`Looking up Creem customer for email: ${user.email}`)
    const customer = await getCreemCustomerByEmail(user.email)

    if (!customer) {
      console.log(`No Creem customer found for email: ${user.email}`)
      // Check if user has a subscription in our database
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('creem_subscription_id')
        .eq('user_id', user.id)
        .single()

      if (!subscription?.creem_subscription_id) {
        return NextResponse.json(
          { error: 'Customer not found. Complete a purchase first.' },
          { status: 404 }
        )
      }

      // User has a subscription record but no customer found
      // Try to redirect to pricing page instead
      return NextResponse.redirect(new URL('/pricing', req.url))
    }

    console.log(`Found Creem customer: ${customer.id}`)
    const portalLink = await createCreemCustomerPortalLink(customer.id)
    return NextResponse.redirect(portalLink)
  } catch (error) {
    console.error('Creem portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal link' },
      { status: 500 }
    )
  }
}

