import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const { siteName, legalName, supportEmail, businessAddress } = getSiteConfig()
  const t = await getTranslations('about')

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-12">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold">{t('title', { siteName })}</h1>
            <p className="text-lg text-muted-foreground">
              {t('description')}
            </p>
          </header>

          <section className="space-y-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-6 border border-amber-200 dark:border-amber-900">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-amber-500/30 flex-shrink-0 overflow-hidden">
                  <img
                    src="/peaceful-prayer-meditation.jpg"
                    alt="koji"
                    className="h-8 w-8 object-cover"
                  />
                </div>
                {t('meetKojiTitle')}
              </h2>
              <p className="text-muted-foreground mb-3">
                <strong>{t('kojiMeaning')}</strong>
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {t('kojiDesc')}
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>{t('kojiHelp1')}</li>
                  <li>{t('kojiHelp2')}</li>
                  <li>{t('kojiHelp3')}</li>
                  <li>{t('kojiHelp4')}</li>
                </ul>
                <p className="italic pt-2 border-t border-amber-200 dark:border-amber-900">
                  {t('kojiQuote')}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="bg-gradient-to-br from-stone-50 to-amber-50 dark:from-stone-950/20 dark:to-amber-950/20 rounded-lg p-6 border border-stone-200 dark:border-stone-900">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>🏔️</span>
                {t('zenHistoryTitle')}
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  {t('zenHistoryP1')}
                </p>
                <p>
                  {t('zenHistoryP2')}
                </p>
                <p>
                  {t('zenHistoryP3')}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('zenWorkCareer')}</li>
                  <li>{t('zenRelationships')}</li>
                  <li>{t('zenAdversity')}</li>
                  <li>{t('zenSelfUnderstanding')}</li>
                </ul>
                <p className="pt-2 border-t border-stone-200 dark:border-stone-900">
                  {t('zenElevating')}
                </p>
                <p className="italic text-stone-700 dark:text-stone-300 pt-2">
                  {t('zenContinues', { siteName })}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">{t('ourApproach')}</h2>
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span>💭</span>
                  {t('heuristicDialogue')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('heuristicDialogueDesc')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span>🌊</span>
                  {t('naturalMetaphors')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('naturalMetaphorsDesc')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span>🤝</span>
                  {t('nonJudgmentalPresence')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('nonJudgmentalPresenceDesc')}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">{t('whatWeOffer')}</h2>
            <p className="text-sm text-muted-foreground italic">
              {t('allPlansRequire')}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{t('freeRegistered')}</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>{t('freeAiConversations')}</li>
                  <li>{t('free10Messages')}</li>
                  <li>{t('freeBasicModel')}</li>
                  <li>{t('freeNoCreditCard')}</li>
                  <li>{t('freeRequiresAccount')}</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
                <h3 className="font-semibold mb-2">{t('proSubscribers')}</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>{t('proAdvancedAI')}</li>
                  <li>{t('pro30Messages')}</li>
                  <li>{t('proPermanentHistory')}</li>
                  <li>{t('proMultipleConversations')}</li>
                  <li>{t('proUnlimitedBasic')}</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-6 border border-red-200 dark:border-red-900">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-red-900 dark:text-red-100">
                <span>⚠️</span>
                {t('importantNotice')}
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-red-900 dark:text-red-100">{t('notMedical', { siteName })}</strong>
                </p>
                <p>
                  {t('aiGuidanceFor')}
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>{t('notMedicalAdvice')}</li>
                  <li>{t('notMentalHealth')}</li>
                  <li>{t('notDiagnosis')}</li>
                  <li>{t('notEmergency')}</li>
                </ul>
                <p className="font-semibold text-red-900 dark:text-red-100">
                  {t('crisisWarning')}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">{t('howItWorks')}</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                {t('howItWorksP1', { siteName })}
              </p>
              <p>
                {t('howItWorksP2')}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">{t('whyChooseUs', { siteName })}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">🎯 {t('purposeBuilt')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('purposeBuiltDesc')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">⏰ {t('alwaysAvailable')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('alwaysAvailableDesc')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">🔒 {t('privateConfidential')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('privateConfidentialDesc')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">🌱 {t('growAtYourPace')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('growAtYourPaceDesc')}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('contactUs')}</h2>
            <p className="text-muted-foreground">
              {t('contactDesc', { email: supportEmail })}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border">
            <h2 className="text-xl font-semibold">{t('businessInfo')}</h2>
            <p className="text-sm text-muted-foreground">
              <strong>{t('legalNameLabel')}</strong> {legalName}
              {businessAddress && (
                <>
                  <br />
                  <strong>{t('addressLabel')}</strong> {businessAddress}
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {t.rich('readOur', {
                terms: (chunks) => <Link className="underline underline-offset-4 hover:text-primary font-medium" href="/terms">{chunks}</Link>,
                privacy: (chunks) => <Link className="underline underline-offset-4 hover:text-primary font-medium" href="/privacy">{chunks}</Link>,
              })}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
