'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'

export function SignInButton() {
  const handleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Button
      size="sm"
      className="bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={handleSignIn}
    >
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
    </Button>
  )
}
