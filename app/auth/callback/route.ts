import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const redirectTo = searchParams.get('redirect_to') ?? '/'

  // Handle OAuth errors (including those caused by ad-blockers)
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorMessage = errorDescription || error
    const encodedError = encodeURIComponent(errorMessage)
    return NextResponse.redirect(
      `${origin}/?error=${encodedError}&error_type=oauth`
    )
  }

  if (!code) {
    console.error('No code parameter in callback')
    return NextResponse.redirect(
      `${origin}/?error=no_code&error_type=oauth`
    )
  }

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
          } catch (err) {
            // Ignore if setting cookies fails
            console.warn('Failed to set cookies:', err)
          }
        },
      },
    }
  )

  try {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent(exchangeError.message)}&error_type=exchange`
      )
    }

    if (data?.user) {
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

    // Successful authentication - redirect to intended destination
    return NextResponse.redirect(`${origin}${redirectTo}`)
  } catch (err) {
    console.error('Unexpected error during authentication:', err)
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent('Authentication failed')}&error_type=server`
    )
  }
}
