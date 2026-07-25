'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function SubscriptionButton() {
  const t = useTranslations('auth')
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/pricing">{t('subscription')}</Link>
    </Button>
  )
}
