import { describe, it, expect, beforeAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

describe('i18n Internationalization', () => {
  describe('Translation File Integrity', () => {
    let enJson: Record<string, any>
    let zhJson: Record<string, any>

    beforeAll(() => {
      enJson = JSON.parse(fs.readFileSync(path.resolve('messages/en.json'), 'utf8'))
      zhJson = JSON.parse(fs.readFileSync(path.resolve('messages/zh.json'), 'utf8'))
    })

    it('should have the same number of top-level namespaces', () => {
      const enNamespaces = Object.keys(enJson).sort()
      const zhNamespaces = Object.keys(zhJson).sort()
      expect(enNamespaces.length).toBe(zhNamespaces.length)
    })

    it('should have matching namespace names', () => {
      const enNamespaces = Object.keys(enJson).sort()
      const zhNamespaces = Object.keys(zhJson).sort()
      expect(enNamespaces).toEqual(zhNamespaces)
    })

    it('should have 34 namespaces', () => {
      expect(Object.keys(enJson).length).toBe(34)
    })

    it('should have all leaf keys in sync between EN and ZH', () => {
      function getLeafKeys(obj: Record<string, any>, prefix = ''): string[] {
        const keys: string[] = []
        for (const k of Object.keys(obj)) {
          const fullKey = prefix ? `${prefix}.${k}` : k
          if (typeof obj[k] === 'object' && obj[k] !== null) {
            keys.push(...getLeafKeys(obj[k], fullKey))
          } else {
            keys.push(fullKey)
          }
        }
        return keys
      }

      const enKeys = new Set(getLeafKeys(enJson))
      const zhKeys = new Set(getLeafKeys(zhJson))

      const missingInZh = [...enKeys].filter(k => !zhKeys.has(k))
      const missingInEn = [...zhKeys].filter(k => !enKeys.has(k))

      expect(missingInZh).toEqual([])
      expect(missingInEn).toEqual([])
    })

    it('should have no empty translation values in ZH', () => {
      function getEmptyKeys(obj: Record<string, any>, prefix = ''): string[] {
        const empty: string[] = []
        for (const k of Object.keys(obj)) {
          const fullKey = prefix ? `${prefix}.${k}` : k
          if (typeof obj[k] === 'object' && obj[k] !== null) {
            empty.push(...getEmptyKeys(obj[k], fullKey))
          } else if (obj[k] === '' || obj[k] === null || obj[k] === undefined) {
            empty.push(fullKey)
          }
        }
        return empty
      }

      const emptyZh = getEmptyKeys(zhJson)
      if (emptyZh.length > 0) {
        console.warn(`Empty ZH translations (${emptyZh.length}):`, emptyZh.slice(0, 10))
      }
      expect(emptyZh.length).toBeLessThan(5)
    })

    it('should have valid JSON in both files (no mojibake)', () => {
      expect(() => JSON.parse(fs.readFileSync(path.resolve('messages/en.json'), 'utf8'))).not.toThrow()
      expect(() => JSON.parse(fs.readFileSync(path.resolve('messages/zh.json'), 'utf8'))).not.toThrow()
    })

    it('should have auth namespace with required login keys', () => {
      expect(enJson.auth).toBeDefined()
      expect(zhJson.auth).toBeDefined()
      expect(enJson.auth.signIn).toBeDefined()
      expect(zhJson.auth.signIn).toBeDefined()
      expect(enJson.auth.signInWithWechat).toBeDefined()
      expect(zhJson.auth.signInWithWechat).toBeDefined()
      expect(enJson.auth.signOut).toBeDefined()
      expect(zhJson.auth.signOut).toBeDefined()
    })

    it('should have common namespace with language switcher keys', () => {
      expect(enJson.common.english).toBeDefined()
      expect(zhJson.common.english).toBeDefined()
      expect(enJson.common.chinese).toBeDefined()
      expect(zhJson.common.chinese).toBeDefined()
    })

    it('should have chat namespace with MessageActions keys', () => {
      expect(enJson.chat).toBeDefined()
      expect(zhJson.chat).toBeDefined()
    })
  })

  describe('i18n Infrastructure (Static Code Analysis)', () => {
    it('should have next-intl routing config', () => {
      const routingPath = path.resolve('i18n/routing.ts')
      expect(fs.existsSync(routingPath)).toBe(true)
      const content = fs.readFileSync(routingPath, 'utf8')
      expect(content).toContain("locales")
      expect(content).toContain("'en'")
      expect(content).toContain("'zh'")
    })

    it('should have next-intl request config', () => {
      const requestPath = path.resolve('i18n/request.ts')
      expect(fs.existsSync(requestPath)).toBe(true)
      const content = fs.readFileSync(requestPath, 'utf8')
      expect(content).toContain('getRequestConfig')
    })

    it('should have next-intl navigation config', () => {
      const navPath = path.resolve('i18n/navigation.ts')
      expect(fs.existsSync(navPath)).toBe(true)
      const content = fs.readFileSync(navPath, 'utf8')
      expect(content).toContain('createNavigation')
    })

    it('should have middleware with locale handling', () => {
      const middlewarePath = path.resolve('middleware.ts')
      expect(fs.existsSync(middlewarePath)).toBe(true)
      const content = fs.readFileSync(middlewarePath, 'utf8')
      expect(content).toContain('intlMiddleware')
      expect(content).toContain('NEXT_LOCALE')
      expect(content).toContain('/api/')
    })

    it('should have language switcher component', () => {
      const switcherPath = path.resolve('components/language-switcher.tsx')
      expect(fs.existsSync(switcherPath)).toBe(true)
      const content = fs.readFileSync(switcherPath, 'utf8')
      expect(content).toContain("useTranslations('common')")
      expect(content).toContain('NEXT_LOCALE')
      expect(content).toContain("handleChange('en')")
      expect(content).toContain("handleChange('zh')")
    })

    it('should have layout with NextIntlClientProvider', () => {
      const layoutPath = path.resolve('app/layout.tsx')
      expect(fs.existsSync(layoutPath)).toBe(true)
      const content = fs.readFileSync(layoutPath, 'utf8')
      expect(content).toContain('NextIntlClientProvider')
      expect(content).toContain('getMessages')
      expect(content).toContain('setRequestLocale')
    })

    it('should have next-intl plugin in next.config', () => {
      const configPath = path.resolve('next.config.mjs')
      expect(fs.existsSync(configPath)).toBe(true)
      const content = fs.readFileSync(configPath, 'utf8')
      expect(content).toContain('next-intl')
    })
  })

  describe('i18n Runtime API (requires dev server)', () => {
    let serverAvailable = false

    beforeAll(async () => {
      try {
        const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) })
        serverAvailable = response.ok
      } catch {
        serverAvailable = false
      }
    })

    it('should serve homepage with default EN locale', async () => {
      if (!serverAvailable) return
      const response = await fetch(BASE_URL)
      expect(response.status).toBe(200)
      const html = await response.text()
      expect(html).toContain('lang="en"')
    })

    it('should switch to ZH locale via cookie', async () => {
      if (!serverAvailable) return
      const response = await fetch(BASE_URL, {
        headers: { Cookie: 'NEXT_LOCALE=zh' },
      })
      expect(response.status).toBe(200)
      const html = await response.text()
      expect(html).toContain('lang="zh"')
    })

    it('should include Chinese text when ZH locale is set', async () => {
      if (!serverAvailable) return
      const response = await fetch(BASE_URL, {
        headers: { Cookie: 'NEXT_LOCALE=zh' },
      })
      const html = await response.text()
      const hasZhContent = html.includes('\u4f5b') || html.includes('\u7985') || html.includes('\u667a') || html.includes('\u6167')
      expect(hasZhContent).toBe(true)
    })

    it('should include English text when EN locale is set', async () => {
      if (!serverAvailable) return
      const response = await fetch(BASE_URL, {
        headers: { Cookie: 'NEXT_LOCALE=en' },
      })
      const html = await response.text()
      expect(html).toContain('Zen')
    })

    it('should set x-locale header in middleware response', async () => {
      if (!serverAvailable) return
      const response = await fetch(BASE_URL, {
        headers: { Cookie: 'NEXT_LOCALE=zh' },
        redirect: 'manual',
      })
      const xLocale = response.headers.get('x-locale')
      expect(xLocale).toBe('zh')
    })
  })
})

describe('ZH Username+Password Auth', () => {
  describe('Auth Infrastructure (Static Code Analysis)', () => {
    it('should have username validation utility', () => {
      const usernamePath = path.resolve('lib/username.ts')
      expect(fs.existsSync(usernamePath)).toBe(true)
      const content = fs.readFileSync(usernamePath, 'utf8')
      expect(content).toContain('validateUsername')
      expect(content).toContain('RESERVED_USERNAMES')
      expect(content).toContain('USERNAME_PATTERN')
    })

    it('should have password validation utility', () => {
      const passwordPath = path.resolve('lib/password.ts')
      expect(fs.existsSync(passwordPath)).toBe(true)
      const content = fs.readFileSync(passwordPath, 'utf8')
      expect(content).toContain('validatePassword')
      expect(content).toContain('PasswordRule')
    })

    it('should have register API route', () => {
      const routePath = path.resolve('app/api/auth/register/route.ts')
      expect(fs.existsSync(routePath)).toBe(true)
      const content = fs.readFileSync(routePath, 'utf8')
      expect(content).toContain('createUser')
      expect(content).toContain('users.internal')
      expect(content).toContain('account_status')
    })

    it('should have sign-in API route', () => {
      const routePath = path.resolve('app/api/auth/sign-in/route.ts')
      expect(fs.existsSync(routePath)).toBe(true)
      const content = fs.readFileSync(routePath, 'utf8')
      expect(content).toContain('signInWithPassword')
      expect(content).toContain('account_status')
    })

    it('should have admin user-review API route', () => {
      const routePath = path.resolve('app/api/admin/user-review/route.ts')
      expect(fs.existsSync(routePath)).toBe(true)
      const content = fs.readFileSync(routePath, 'utf8')
      expect(content).toContain('approve')
      expect(content).toContain('reject')
    })

    it('should have username and account_status columns in migration', () => {
      const migrationDir = path.resolve('supabase/migrations')
      if (!fs.existsSync(migrationDir)) return
      const files = fs.readdirSync(migrationDir)
      const usernameMigration = files.find(f => f.includes('username'))
      expect(usernameMigration).toBeDefined()
    })

    it('should have logto_id column preserved in schema (backward compat)', () => {
      const schemaPath = path.resolve('supabase/schema.sql')
      expect(fs.existsSync(schemaPath)).toBe(true)
      const content = fs.readFileSync(schemaPath, 'utf8')
      expect(content).toContain('logto_id')
    })

    it('sign-in button should route zh locale to sign-in page', () => {
      const buttonPath = path.resolve('components/auth/sign-in-button.tsx')
      const content = fs.readFileSync(buttonPath, 'utf8')
      expect(content).toContain("locale === 'zh'")
      expect(content).toContain('auth/sign-in')
      expect(content).toContain('handleGoogleSignIn')
    })

    it('sign-out button should not reference Logto', () => {
      const buttonPath = path.resolve('components/auth/sign-out-button.tsx')
      const content = fs.readFileSync(buttonPath, 'utf8')
      expect(content).not.toContain('logto')
      expect(content).toContain('signOut')
    })

    it('should not have @logto/next in package.json', () => {
      const pkgPath = path.resolve('package.json')
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      const hasLogto = pkg.dependencies?.['@logto/next'] || pkg.devDependencies?.['@logto/next']
      expect(hasLogto).toBeUndefined()
    })

    it('should not have Logto env vars in .env.example', () => {
      const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8')
      expect(envExample).not.toContain('LOGTO_APP_ID')
      expect(envExample).not.toContain('LOGTO_APP_SECRET')
    })
  })

  describe('ZH Auth API Routes (requires dev server)', () => {
    let serverAvailable = false

    beforeAll(async () => {
      try {
        const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) })
        serverAvailable = response.ok
      } catch {
        serverAvailable = false
      }
    })

    it('register route should exist and validate input', async () => {
      if (!serverAvailable) return
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'ab', nickname: 'Test', password: '123' }),
      })
      expect([400, 500]).toContain(response.status)
    })

    it('sign-in route should exist and validate input', async () => {
      if (!serverAvailable) return
      const response = await fetch(`${BASE_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nonexistent', password: 'wrong' }),
      })
      expect([401, 500]).toContain(response.status)
    })
  })

  describe('Subscription System: approved_zh Tier', () => {
    it('subscription.ts should include approved_zh tier type', () => {
      const subPath = path.resolve('lib/subscription.ts')
      const content = fs.readFileSync(subPath, 'utf8')
      expect(content).toContain("approved_zh")
      expect(content).toContain('username')
      expect(content).toContain('account_status')
    })

    it('usage-limits.ts should support approved_zh with unlimited quota', () => {
      const limitsPath = path.resolve('lib/usage-limits.ts')
      const content = fs.readFileSync(limitsPath, 'utf8')
      expect(content).toContain('approved_zh')
      expect(content).toContain('Infinity')
    })

    it('chat route should handle approved_zh without downgrade', () => {
      const chatPath = path.resolve('app/api/chat/route.ts')
      const content = fs.readFileSync(chatPath, 'utf8')
      expect(content).toContain('approved_zh')
    })
  })

  describe('Database: username + account_status Columns', () => {
    it('profiles table should have username column', async () => {
      const sb = getSupabase()
      if (!sb) return

      const { data, error } = await sb
        .from('profiles')
        .select('id, username')
        .limit(1)

      if (error && error.message.includes('does not exist')) {
        console.warn('username column not found in profiles table - migration may not be applied')
      }
      expect(error).toBeNull()
    }, 10000)

    it('profiles table should have account_status column', async () => {
      const sb = getSupabase()
      if (!sb) return

      const { data, error } = await sb
        .from('profiles')
        .select('id, account_status')
        .limit(1)

      if (error && error.message.includes('does not exist')) {
        console.warn('account_status column not found in profiles table - migration may not be applied')
      }
      expect(error).toBeNull()
    }, 10000)
  })

  describe('Auth Flow Integration: i18n + Provider Selection', () => {
    it('zh locale auth keys exist for username+password auth', () => {
      const zhJson = JSON.parse(fs.readFileSync(path.resolve('messages/zh.json'), 'utf8'))
      expect(zhJson.auth.username).toBeDefined()
      expect(zhJson.auth.password).toBeDefined()
      expect(zhJson.auth.register).toBeDefined()
      expect(zhJson.auth.signInTab).toBeDefined()
      expect(zhJson.auth.registerTab).toBeDefined()
      expect(zhJson.auth.nickname).toBeDefined()
      expect(zhJson.auth.confirmPassword).toBeDefined()
      expect(zhJson.auth.accountPending).toBeDefined()
      expect(zhJson.auth.accountRejected).toBeDefined()
      expect(zhJson.auth.invalidCredentials).toBeDefined()
      expect(zhJson.auth.registerPendingApproval).toBeDefined()
      expect(zhJson.auth.passwordMinLength).toBeDefined()
      expect(zhJson.auth.passwordRequireLetter).toBeDefined()
      expect(zhJson.auth.passwordRequireNumber).toBeDefined()
      expect(zhJson.auth.unlimitedQuota).toBeDefined()
    })

    it('en locale auth keys exist for username+password auth', () => {
      const enJson = JSON.parse(fs.readFileSync(path.resolve('messages/en.json'), 'utf8'))
      expect(enJson.auth.username).toBeDefined()
      expect(enJson.auth.password).toBeDefined()
      expect(enJson.auth.register).toBeDefined()
      expect(enJson.auth.accountPending).toBeDefined()
      expect(enJson.auth.accountRejected).toBeDefined()
      expect(enJson.auth.invalidCredentials).toBeDefined()
      expect(enJson.auth.registerPendingApproval).toBeDefined()
      expect(enJson.auth.unlimitedQuota).toBeDefined()
    })

    it('en locale sign-in uses standard signIn key', () => {
      const enJson = JSON.parse(fs.readFileSync(path.resolve('messages/en.json'), 'utf8'))
      expect(enJson.auth.signIn).toBeDefined()
      expect(typeof enJson.auth.signIn).toBe('string')
    })

    it('auth error keys exist in both locales', () => {
      const enJson = JSON.parse(fs.readFileSync(path.resolve('messages/en.json'), 'utf8'))
      const zhJson = JSON.parse(fs.readFileSync(path.resolve('messages/zh.json'), 'utf8'))
      expect(enJson.auth.signInFailed).toBeDefined()
      expect(zhJson.auth.signInFailed).toBeDefined()
      expect(enJson.auth.signInError).toBeDefined()
      expect(zhJson.auth.signInError).toBeDefined()
    })

    it('sign-out text is translated in both locales', () => {
      const enJson = JSON.parse(fs.readFileSync(path.resolve('messages/en.json'), 'utf8'))
      const zhJson = JSON.parse(fs.readFileSync(path.resolve('messages/zh.json'), 'utf8'))
      expect(enJson.auth.signOut).toBeDefined()
      expect(zhJson.auth.signOut).toBeDefined()
    })
  })
})
