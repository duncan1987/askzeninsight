import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import { cookies } from 'next/headers'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as 'en' | 'zh')) {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
    if (cookieLocale && routing.locales.includes(cookieLocale as 'en' | 'zh')) {
      locale = cookieLocale
    } else {
      locale = routing.defaultLocale
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
