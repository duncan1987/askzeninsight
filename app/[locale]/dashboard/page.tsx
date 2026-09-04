import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { UsageMeter } from '@/components/usage-meter'
import { SubscriptionStatusCard } from '@/components/subscription-status-card'
import { DataManagementCard } from '@/components/data-management-card'
import { CheckinCalendar } from '@/components/study/checkin-calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getSiteConfig } from '@/lib/site'
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
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
      .in('status', ['active', 'cancelled', 'canceled'])
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  let usageCount = 0
  if (subscription.data) {
    const subscriptionStart = new Date(subscription.data.created_at)
    const { data: usageRecords } = await supabase
      .from('usage_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('message_type', 'user')
      .eq('subscription_id', subscription.data.id)
      .gte('timestamp', subscriptionStart.toISOString())

    usageCount = usageRecords?.length || 0
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('welcomeBack', { name: user.user_metadata?.name?.split(' ')[0] || 'User' })}
            </h1>
            <p className="text-muted-foreground">
              {t('manageJourney')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('dailyUsage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageMeter />
            </CardContent>
          </Card>

          {subscription.data ? (
            <SubscriptionStatusCard
              subscription={subscription.data}
              usageCount={usageCount}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('subscription')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    {t('freePlanDesc')}
                  </p>
                  <Button asChild>
                    <Link href="/pricing">{t('viewPlans')}</Link>
                  </Button>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t('questions')}{' '}
                    <a className="underline underline-offset-4" href={`mailto:${supportEmail}`}>
                      {supportEmail}
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('recentConversations')}</CardTitle>
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
                  {t('noConversations')}
                </p>
              )}
            </CardContent>
          </Card>

          <DataManagementCard conversationCount={conversations.data?.length || 0} />

          <CheckinCalendar userId={user.id} />
        </div>
      </main>
    </div>
  )
}
