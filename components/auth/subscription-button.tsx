'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export function SubscriptionButton() {
  const t = useTranslations('auth')
  const locale = useLocale()

  if (locale === 'zh') {
    return null
  }

  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/pricing">{t('subscription')}</Link>
    </Button>
  )
}
