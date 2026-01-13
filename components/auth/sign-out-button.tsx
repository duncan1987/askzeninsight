'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface SignOutButtonProps {
  variant?: 'button' | 'dropdown'
}

export function SignOutButton({ variant = 'dropdown' }: SignOutButtonProps) {
  const router = useRouter()
  const handleSignOut = async () => {
    const supabase = createClient()
    if (!supabase) {
      router.push('/')
      return
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    )
  }

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </DropdownMenuItem>
  )
}
