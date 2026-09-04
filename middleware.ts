import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const intlMiddleware = createMiddleware(routing)

const ZH_COUNTRIES = new Set([
  'CN', 'TW', 'HK', 'MO', 'SG',
])

async function detectLocaleFromIP(request: NextRequest): Promise<string> {
  const vercelCountry = request.headers.get('x-vercel-ip-country')
  if (vercelCountry) {
    return ZH_COUNTRIES.has(vercelCountry) ? 'zh' : 'en'
  }

  const acceptLang = request.headers.get('accept-language') || ''
  if (/zh/i.test(acceptLang)) {
    return 'zh'
  }

  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = realIp || (forwarded ? forwarded.split(',')[0].trim() : '')

    if (ip && ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)

      const res = await fetch(`https://ipapi.co/${ip}/country/`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AskZenInsight/1.0' },
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const country = (await res.text()).trim()
        if (ZH_COUNTRIES.has(country)) {
          return 'zh'
        }
      }
    }
  } catch {
    // Geolocation failed, fall through
  }

  return routing.defaultLocale
}

async function refreshSupabaseSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    })

    await supabase.auth.getUser()
  } catch (e) {
    console.error('[Middleware] Supabase session refresh failed:', e)
  }

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/auth/callback')
  ) {
    return NextResponse.next()
  }

  // Refresh Supabase session for all routes (except static assets)
  const supabaseResponse = await refreshSupabaseSession(request)

  // API routes and admin: just pass through with refreshed session
  if (
    pathname.startsWith('/api/') ||
    pathname === '/admin' || pathname.startsWith('/admin/')
  ) {
    return supabaseResponse
  }

  // Locale detection for page routes
  let locale = request.cookies.get('NEXT_LOCALE')?.value
  let needsCookieSet = false

  if (!locale) {
    locale = await detectLocaleFromIP(request)
    needsCookieSet = true
  }

  if (!routing.locales.includes(locale)) {
    locale = routing.defaultLocale
  }

  request.cookies.set('NEXT_LOCALE', locale)

  const response = intlMiddleware(request)

  if (needsCookieSet) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  response.headers.set('x-locale', locale)

  // Merge Supabase session cookies into intl response
  for (const cookie of supabaseResponse.cookies.getAll()) {
    if (!response.cookies.get(cookie.name)) {
      response.cookies.set(cookie.name, cookie.value)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
