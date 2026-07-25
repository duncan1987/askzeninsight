'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('auth')
  const locale = useLocale()

  const handleGoogleSignIn = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      if (!supabase) {
        console.error('Supabase client is not configured')
        showError(t('notConfigured'))
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        setIsLoading(false)
        showError(`${t('signInFailed')}: ${error.message}`)
        return
      }

      if (data?.url) {
        setTimeout(() => {
          window.location.href = data.url
        }, 100)
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      setIsLoading(false)

      const errorMessage = error?.message || String(error)
      const isLikelyAdBlocker =
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('blocked')

      if (isLikelyAdBlocker) {
        showError(t('adBlockerMsg'))
      } else {
        showError(`${t('signInError')}: ${errorMessage}`)
      }
    }
  }

  const handleLogtoSignIn = async (connectorId?: string) => {
    setIsLoading(true)
    try {
      const params = connectorId ? `?connector=${connectorId}` : ''
      window.location.href = `${window.location.origin}/api/auth/logto/sign-in${params}`
    } catch (error) {
      console.error('Logto sign in error:', error)
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (locale === 'zh') {
      await handleLogtoSignIn()
    } else {
      await handleGoogleSignIn(e)
    }
  }

  const buttonText = locale === 'zh' ? t('signInWithWechat') : t('signIn')

  return (
    <Button
      type="button"
      size="sm"
      className="bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={handleSignIn}
      disabled={isLoading}
    >
      <LogIn className="mr-2 h-4 w-4" />
      {isLoading ? t('loading') : buttonText}
    </Button>
  )
}

function showError(message: string) {
  alert(message)
}
