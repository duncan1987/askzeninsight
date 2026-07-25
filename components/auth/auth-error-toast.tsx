'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export function AuthErrorToast() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorType = searchParams.get('error_type')
  const [isVisible, setIsVisible] = useState(false)
  const t = useTranslations('auth')

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      url.searchParams.delete('error_type')
      window.history.replaceState({}, '', url.toString())
    }
  }, [error])

  if (!isVisible || !error) return null

  const decodedError = decodeURIComponent(error)
  const isAdBlockerRelated =
    decodedError.includes('blocked') ||
    decodedError.includes('fetch') ||
    decodedError.includes('network') ||
    errorType === 'oauth'

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-foreground">
              {t('authFailed')}
            </h3>
            <div className="mt-1 text-sm text-muted-foreground">
              {isAdBlockerRelated ? (
                <p>{t('adBlockerMsg')}</p>
              ) : (
                <p>{decodedError}</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setIsVisible(false)}
              >
                {t('dismiss')}
              </Button>
              {isAdBlockerRelated && (
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.location.reload()}
                >
                  {t('tryAgain')}
                </Button>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
