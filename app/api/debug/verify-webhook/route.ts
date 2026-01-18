import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Verify webhook configuration and subscription status
 * GET /api/debug/verify-webhook
 */
export async function GET() {
  const results = {
    webhook: {
      endpoint: 'https://zeninsight.xyz/api/creem/webhook',
      reachable: false,
      method: 'POST',
    },
    environment: {
      creemApiKey: !!process.env.CREEM_API_KEY,
      webhookSecret: !!process.env.CREEM_WEBHOOK_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    database: {
      connected: false,
      subscriptions: 0,
      latestSubscription: null,
    },
    diagnostics: [] as string[],
  }

  // Check environment variables
  if (!process.env.CREEM_API_KEY) {
    results.diagnostics.push('⚠️  CREEM_API_KEY is missing')
  }
  if (!process.env.CREEM_WEBHOOK_SECRET) {
    results.diagnostics.push('⚠️  CREEM_WEBHOOK_SECRET is missing')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    results.diagnostics.push('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing')
  }

  // Test database connection
  try {
    const supabase = createAdminClient()
    if (!supabase) {
      results.diagnostics.push('❌ Failed to create Supabase admin client')
    } else {
      results.database.connected = true

      // Get subscriptions count
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        results.diagnostics.push(`❌ Database error: ${error.message}`)
      } else {
        results.database.subscriptions = subscriptions?.length || 0
        if (subscriptions && subscriptions.length > 0) {
          results.database.latestSubscription = {
            id: subscriptions[0].id,
            user_id: subscriptions[0].user_id,
            creem_subscription_id: subscriptions[0].creem_subscription_id,
            status: subscriptions[0].status,
            plan: subscriptions[0].plan,
            created_at: subscriptions[0].created_at,
          }
        }
      }
    }
  } catch (error) {
    results.diagnostics.push(`❌ Database connection failed: ${error}`)
  }

  // Determine overall status
  const hasIssues = results.diagnostics.some(d => d.startsWith('❌'))
  const hasWarnings = results.diagnostics.some(d => d.startsWith('⚠️'))

  let status = '✅ All checks passed'
  if (hasIssues) status = '❌ Configuration has errors'
  else if (hasWarnings) status = '⚠️  Configuration has warnings'

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    ...results,
    nextSteps: results.database.subscriptions === 0
      ? [
          '1. Complete a test subscription at https://zeninsight.xyz/pricing',
          '2. Check Vercel logs for webhook activity',
          '3. Verify subscription appears in this check endpoint',
        ]
      : [
          '✅ Subscriptions detected - webhook is working!',
          'You can proceed with testing cancel functionality.',
        ],
  })
}
