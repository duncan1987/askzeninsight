import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-webhook-signature')

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.SUPABASE_AUTH_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret)
      hmac.update(body)
      const digest = hmac.digest('base64')
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${digest}`))) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)

    // Handle user creation event
    if (event.event === 'user.created' || event.event === 'user.signup') {
      const user = event.data

      // Create profile using service role key
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase environment variables are not configured')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Extract user metadata
      const metadata = user.user_metadata || user.raw_user_meta_data || {}

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: metadata.full_name || metadata.name || '',
          avatar_url: metadata.avatar_url || metadata.picture || ''
        })

      if (error) {
        console.error('Error creating profile:', error)
        // Don't fail the webhook if profile creation fails
        // You may want to log this for manual review
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
