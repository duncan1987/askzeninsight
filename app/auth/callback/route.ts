import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect_to') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are not configured')
      return NextResponse.redirect(`${origin}/?error=supabase_not_configured`)
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore if setting cookies fails
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Create profile if it doesn't exist using service role key
      if (supabaseServiceKey) {
        const serviceSupabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        const metadata = data.user.user_metadata || {}

        // Use upsert to handle both new and existing users
        await serviceSupabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: metadata.full_name || metadata.name || '',
            avatar_url: metadata.avatar_url || metadata.picture || ''
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
