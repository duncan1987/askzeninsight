import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelSubscription } from '@/lib/creem'
import { sendRefundReviewEmail } from '@/lib/email'

export const runtime = 'nodejs'

/**
 * Admin API for reviewing refund requests
 *
 * POST /api/admin/refund-review
 *
 * Body:
 * - subscriptionId: string (required)
 * - action: 'approve' | 'reject' (required)
 * - notes: string (optional)
 *
 * This endpoint:
 * 1. Verifies admin authentication
 * 2. Updates refund status in database
 * 3. Cancels Creem subscription if approved
 * 4. Sends notification email to user
 */
export async function POST(req: Request) {
  try {
    // Verify admin authentication
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      )
    }

    // Get current admin user
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { subscriptionId, action, notes } = body as {
      subscriptionId: string
      action: 'approve' | 'reject'
      notes?: string
    }

    if (!subscriptionId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. subscriptionId and action (approve/reject) are required.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    // Get subscription details
    const { data: subscription, error: fetchError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Verify subscription is in 'requested' status
    if (subscription.refund_status !== 'requested') {
      return NextResponse.json(
        { error: `Subscription refund status is '${subscription.refund_status}'. Can only review subscriptions with status 'requested'.` },
        { status: 400 }
      )
    }

    console.log('[Admin Refund Review] Processing review:', {
      subscriptionId,
      action,
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      subscription,
    })

    // Update subscription with review decision
    const updateData: any = {
      refund_status: action === 'approve' ? 'approved' : 'rejected',
      refund_reviewed_at: new Date().toISOString(),
      refund_reviewed_by: adminUser.id,
      refund_notes: notes || null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await adminClient
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('[Admin Refund Review] Failed to update subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    // If approved, cancel subscription in Creem
    let creemCancellationSuccess = false
    if (action === 'approve') {
      try {
        await cancelSubscription({
          subscriptionId: subscription.creem_subscription_id,
          mode: 'immediate',
        })
        creemCancellationSuccess = true
        console.log('[Admin Refund Review] Creem subscription cancelled successfully')

        // Also mark subscription as cancelled in our database
        await adminClient
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancel_at_period_end: true,
          })
          .eq('id', subscriptionId)
      } catch (creemError) {
        console.error('[Admin Refund Review] Creem cancel error:', creemError)
        // Continue anyway - we'll note this in the response
      }
    }

    // Get user details for email
    const { data: userData } = await adminClient.auth.admin.getUserById(subscription.user_id)

    // Send notification email to user
    if (userData?.user?.email) {
      try {
        await sendRefundReviewEmail({
          userEmail: userData.user.email,
          userName: userData.user.user_metadata?.name || userData.user.user_metadata?.full_name,
          subscriptionId,
          refundAmount: subscription.refund_amount,
          action,
          notes,
          adminNotes: creemCancellationSuccess ? '' : 'Note: Subscription cancellation in payment system is pending manual processing.',
        })
        console.log('[Admin Refund Review] Notification email sent')
      } catch (emailError) {
        console.error('[Admin Refund Review] Failed to send email:', emailError)
      }
    }

    // Build response
    const response = {
      success: true,
      message: action === 'approve'
        ? 'Refund approved. User has been notified and subscription cancelled.'
        : 'Refund rejected. User has been notified.',
      subscriptionId,
      action,
      refundAmount: subscription.refund_amount ? `$${subscription.refund_amount.toFixed(2)}` : null,
      creemCancelled: action === 'approve' && creemCancellationSuccess,
      reviewedAt: updateData.refund_reviewed_at,
    }

    console.log('[Admin Refund Review] Review completed:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Admin Refund Review] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process refund review'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to list pending refund reviews
 *
 * GET /api/admin/refund-review?status=requested
 *
 * Returns list of subscriptions awaiting refund review
 */
export async function GET(req: Request) {
  try {
    // Verify admin authentication
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'requested'

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    // Get subscriptions with specified refund status
    const { data: subscriptions, error } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('refund_status', status)
      .order('refund_estimated_at', { ascending: false })

    if (error) {
      console.error('[Admin Refund Review] Failed to fetch subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    // Get user details for each subscription
    const subscriptionsWithUsers = await Promise.all(
      (subscriptions || []).map(async (sub) => {
        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(sub.user_id)
          return {
            ...sub,
            userEmail: userData?.user?.email,
            userName: userData?.user?.user_metadata?.name || userData?.user?.user_metadata?.full_name,
          }
        } catch {
          return sub
        }
      })
    )

    return NextResponse.json({
      success: true,
      count: subscriptionsWithUsers.length,
      subscriptions: subscriptionsWithUsers,
    })
  } catch (error) {
    console.error('[Admin Refund Review] GET error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch refund requests'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
