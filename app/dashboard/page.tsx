import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { UsageMeter } from '@/components/usage-meter'
import { SubscriptionStatusCard } from '@/components/subscription-status-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getSiteConfig } from '@/lib/site'

// Force dynamic rendering because this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { supportEmail } = getSiteConfig()
  const supabase = await createClient()
  if (!supabase) {
    redirect('/?error=supabase_not_configured')
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch user data
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [conversations, subscription, usageRecords] = await Promise.all([
    supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10),

    // Get subscription (including cancelled ones that are still active)
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'cancelled', 'canceled'])
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Get today's message count
    supabase
      .from('usage_records')
      .select('id')
      .eq('user_id', user.id)
      .gte('timestamp', today.toISOString())
  ])

  // Calculate usage count for refund eligibility
  const usageCount = usageRecords.data?.length || 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.user_metadata?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground">
              Manage your spiritual journey and conversations
            </p>
          </div>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageMeter />
            </CardContent>
          </Card>

          {/* Subscription Status */}
          {subscription.data ? (
            <SubscriptionStatusCard
              subscription={subscription.data}
              usageCount={usageCount}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    You&apos;re on the free plan. Upgrade for more features.
                  </p>
                  <Button asChild>
                    <Link href="/pricing">View Plans</Link>
                  </Button>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Questions?{' '}
                    <a className="underline underline-offset-4" href={`mailto:${supportEmail}`}>
                      {supportEmail}
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Conversations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.data && conversations.data.length > 0 ? (
                <div className="space-y-2">
                  {conversations.data.map((conv) => (
                    <Link
                      key={conv.id}
                      href={`/chat?conversation=${conv.id}`}
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <p className="font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  No conversations yet. Start chatting!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
