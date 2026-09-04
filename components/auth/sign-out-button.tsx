'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useTranslations } from 'next-intl'

interface SignOutButtonProps {
  variant?: 'button' | 'dropdown'
}

export function SignOutButton({ variant = 'dropdown' }: SignOutButtonProps) {
  const router = useRouter()
  const t = useTranslations('auth')

  const handleSignOut = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }

    router.push('/')
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        {t('signOut')}
      </Button>
    )
  }

  return (
    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
      <LogOut className="mr-2 h-4 w-4" />
      {t('signOut')}
    </DropdownMenuItem>
  )
}
