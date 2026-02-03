'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import { useState } from 'react'

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      if (!supabase) {
        console.error('Supabase client is not configured')
        showError('Sign-in is not configured. Please check environment variables.')
        setIsLoading(false)
        return
      }

      // Use PKCE flow with explicit redirect handling
      // This is more resistant to ad-blocker interference
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
        showError(`Sign-in failed: ${error.message}`)
        return
      }

      // Use direct window.location.href instead of anchor click
      // This is more reliable when ad-blockers are present
      if (data?.url) {
        // Add a small timeout to allow the UI to update
        setTimeout(() => {
          window.location.href = data.url
        }, 100)
      }
    } catch (error: any) {
      console.error('Sign in error:', error)

      setIsLoading(false)

      // Detect if this might be an ad-blocker issue
      const errorMessage = error?.message || String(error)
      const isLikelyAdBlocker =
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('blocked')

      if (isLikelyAdBlocker) {
        showError(getAdBlockerMessage())
      } else {
        showError(`Sign-in error: ${errorMessage}`)
      }
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      className="bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={handleSignIn}
      disabled={isLoading}
    >
      <LogIn className="mr-2 h-4 w-4" />
      {isLoading ? 'Loading...' : 'Sign In'}
    </Button>
  )
}

function showError(message: string) {
  alert(message)
}

function getAdBlockerMessage(): string {
  return `Sign-in failed. This may be caused by an ad-blocker.

Please try:
• Disabling your ad-blocker for this site
• Adding ask.zeninsight.xyz to your allowlist
• Using an incognito/private window

If the problem persists, please contact support.`
}
