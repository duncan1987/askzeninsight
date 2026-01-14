import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { UsageMeter } from '@/components/usage-meter'
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
    redirect('/api/auth/signin')
  }

  // Fetch user data
  const [conversations, subscription] = await Promise.all([
    supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10),

    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .single(),
  ])

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
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription.data ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Pro Plan Active</p>
                      <p className="text-sm text-muted-foreground">
                        Renews on{' '}
                        {new Date(
                          subscription.data.current_period_end
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button asChild variant="outline">
                      <Link href="/api/creem/portal">Manage billing</Link>
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Need help?{' '}
                      <a className="underline underline-offset-4" href={`mailto:${supportEmail}`}>
                        {supportEmail}
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>

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
