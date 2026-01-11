'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>('Click button to test')

  const testEnvVars = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    setStatus(`
      Environment Variables:
      URL: ${url ? '✅ SET' : '❌ NOT SET'}
      Key: ${key ? '✅ SET' : '❌ NOT SET'}

      URL Value: ${url || 'undefined'}
      Key Value: ${key ? 'SET (length: ' + key.length + ')' : 'undefined'}
    `)
  }

  const testSupabaseClient = () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        setStatus('❌ Cannot create client - env vars not set')
        return
      }

      const supabase = createBrowserClient(url, key)
      setStatus('✅ Supabase client created successfully!\n\nClient: ' + JSON.stringify(supabase, null, 2))
    } catch (error) {
      setStatus('❌ Error creating client: ' + (error as Error).message)
    }
  }

  const testOAuth = async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        setStatus('❌ Cannot test OAuth - env vars not set')
        return
      }

      const supabase = createBrowserClient(url, key)
      setStatus('⏳ Initiating OAuth...')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setStatus('❌ OAuth Error: ' + error.message)
      } else {
        setStatus('✅ OAuth initiated!\n\nData: ' + JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setStatus('❌ OAuth Exception: ' + (error as Error).message)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Supabase Auth Test Page</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
        <Button onClick={testEnvVars}>Test Environment Variables</Button>
        <Button onClick={testSupabaseClient}>Test Supabase Client</Button>
        <Button onClick={testOAuth}>Test Google OAuth</Button>
      </div>

      <pre style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {status}
      </pre>
    </div>
  )
}
