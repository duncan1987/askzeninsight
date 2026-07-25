import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/auth/callback')
  ) {
    return NextResponse.next()
  }

  const response = intlMiddleware(request)

  const locale = request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale
  response.headers.set('x-locale', locale)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
