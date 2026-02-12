import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DebugSubscriptionPage() {
  const supabase = await createClient()
  if (!supabase) {
    redirect('/?error=supabase_not_configured')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const adminClient = createAdminClient()

  // Get subscription data
  const { data: subscriptions } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate tier
  const subscription = subscriptions?.[0]
  const now = new Date().toISOString()

  let hasRefundRequest = false
  let isInReviewPeriod = false

  if (subscription?.refund_status && subscription.refund_status !== 'none') {
    hasRefundRequest = true

    if (subscription.refund_status === 'requested' && subscription.refund_estimated_at) {
      const reviewDeadline = new Date(subscription.refund_estimated_at)
      reviewDeadline.setDate(reviewDeadline.getDate() + 3)

      if (now <= reviewDeadline.toISOString()) {
        isInReviewPeriod = true
      }
    }
  }

  const isPro = subscription &&
    ['active', 'cancelled', 'canceled'].includes(subscription.status) &&
    new Date(subscription.current_period_end) >= new Date(now) &&
    (!hasRefundRequest || isInReviewPeriod) &&
    subscription.refund_status !== 'approved' &&
    subscription.refund_status !== 'rejected'

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Subscription Debug Info</h1>

        <div className="bg-card rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">User Info</h2>
          <pre className="bg-muted p-4 rounded overflow-auto">
            {JSON.stringify({ id: user.id, email: user.email }, null, 2)}
          </pre>
        </div>

        <div className="bg-card rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Raw Subscription Data</h2>
          <pre className="bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(subscription, null, 2)}
          </pre>
        </div>

        <div className="bg-card rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Calculated Values</h2>
          <div className="space-y-2 text-sm">
            <p><strong>hasRefundRequest:</strong> {hasRefundRequest.toString()}</p>
            <p><strong>isInReviewPeriod:</strong> {isInReviewPeriod.toString()}</p>
            <p><strong>isPro:</strong> <span className={isPro ? 'text-green-600' : 'text-red-600'}>{isPro.toString()}</span></p>
            <p><strong>Current Tier:</strong> {isPro ? 'PRO' : 'FREE'}</p>
            {subscription?.refund_estimated_at && (
              <>
                <p><strong>Refund Estimated:</strong> {new Date(subscription.refund_estimated_at).toLocaleString()}</p>
                <p><strong>Review Deadline:</strong> {
                  new Date(new Date(subscription.refund_estimated_at).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleString()
                }</p>
                <p><strong>Now:</strong> {new Date().toLocaleString()}</p>
                <p><strong>In Review Period:</strong> {
                  now <= new Date(new Date(subscription.refund_estimated_at).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
                    ? 'YES ✅' : 'NO ❌'
                }</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Explanation</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Expected behavior:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>48h-7天取消后，refund_status应该为 'requested'</li>
              <li>status应该保持为 'active' (不是 'cancelled')</li>
              <li>isPro应该为 true (在3天审核期内)</li>
              <li>Dashboard应该显示30条/天的Pro用量</li>
            </ul>

            {!isPro && subscription?.refund_status === 'requested' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 font-semibold">⚠️ ISSUE DETECTED!</p>
                <p className="text-red-700">refund_status='requested' but isPro=false</p>
                <p className="text-red-700 text-sm mt-2">
                  This means the logic is incorrectly downgrading to Free tier during review period.
                </p>
              </div>
            )}

            {isPro && subscription?.refund_status === 'requested' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 font-semibold">✅ CORRECT!</p>
                <p className="text-green-700">
                  User is correctly kept as Pro tier during refund review period.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
