'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import { useState, useRef } from 'react'

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)

  const handleSignIn = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    setIsLoading(true)
    try {
      const supabase = createClient()

      if (!supabase) {
        console.error('Supabase client is not configured')
        alert('登录功能未配置，请检查环境变量')
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        alert(`登录失败: ${error.message}`)
        setIsLoading(false)
        return
      }

      // Use an anchor tag to trigger navigation
      if (data?.url && linkRef.current) {
        linkRef.current.href = data.url
        linkRef.current.click()
      }
    } catch (error) {
      console.error('Sign in error:', error)
      alert('登录出错，请查看控制台')
      setIsLoading(false)
    }
  }

  return (
    <>
      <a
        ref={linkRef}
        href=""
        style={{ display: 'none' }}
        target="_self"
        rel="noopener noreferrer"
      >
        Redirect to Google
      </a>
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
    </>
  )
}
