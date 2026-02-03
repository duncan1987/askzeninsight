import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendExpiryReminderEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handleRequest(req: Request) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET environment variable not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Calculate date 7 days from now
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    sevenDaysFromNow.setHours(23, 59, 59, 999) // End of the day

    console.log('[Cron] Checking for subscriptions expiring within 7 days:', sevenDaysFromNow.toISOString())

    // Find active subscriptions expiring within 7 days
    // IMPORTANT: Only send reminder if reminder_sent_at is NULL (not yet sent)
    const { data: expiring, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        current_period_end,
        plan,
        user_id,
        reminder_sent_at,
        profiles!inner (email, full_name)
      `)
      .eq('status', 'active')
      .lte('current_period_end', sevenDaysFromNow.toISOString())
      .is('reminder_sent_at', null)  // Only get subscriptions that haven't received a reminder yet
      .is('replaced_by_new_plan', false)

    if (error) {
      console.error('[Cron] Error fetching expiring subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    console.log('[Cron] Found subscriptions expiring soon:', expiring?.length || 0)

    if (!expiring || expiring.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions expiring within 7 days',
        count: 0,
      })
    }

    // Send reminder emails
    let successCount = 0
    let failureCount = 0

    for (const sub of expiring) {
      const userEmail = (sub as any).profiles?.email
      if (!userEmail) {
        console.warn('[Cron] Skipping subscription without user email:', sub.id)
        failureCount++
        continue
      }

      try {
        await sendExpiryReminderEmail({
          userEmail,
          userName: (sub as any).profiles?.full_name,
          plan: sub.plan,
          currentPeriodEnd: sub.current_period_end,
          subscriptionId: sub.id,
        })

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', sub.id)

        if (updateError) {
          console.warn('[Cron] Failed to mark reminder as sent for subscription:', sub.id, updateError)
        }

        console.log('[Cron] Reminder email sent for subscription:', sub.id)
        successCount++
      } catch (emailError) {
        console.error('[Cron] Failed to send reminder email for subscription:', sub.id, emailError)
        failureCount++
      }
    }

    return NextResponse.json({
      success: true,
      total: expiring.length,
      successCount,
      failureCount,
      message: `Processed ${expiring.length} subscriptions`,
    })
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  return handleRequest(req)
}

export async function POST(req: Request) {
  return handleRequest(req)
}
