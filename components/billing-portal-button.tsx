'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false)
  const t = useTranslations('billing')

  const handleClick = async () => {
    setLoading(true)
    try {
      window.location.href = '/api/creem/portal'
    } catch (error) {
      console.error('Failed to open billing portal:', error)
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {t('opening')}
        </>
      ) : (
        t('manageBilling')
      )}
    </Button>
  )
}
