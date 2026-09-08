/**
 * Auth password transport encryption tests
 *
 - Roundtrip: browser-style encryption (WebCrypto, same API as the client
 * helper) -> server-side decryptIncomingPassword
 * - Plaintext passthrough (legacy clients / tests)
 * - Tamper detection
 * - Live API: public-key endpoint + sign-in with encrypted password
 *
 * Live tests require a dev server on http://localhost:3000
 * Run: run-tests.bat tests/auth-encryption.test.ts
 */

import { webcrypto } from 'crypto'
import { decryptIncomingPassword } from '../lib/auth-crypto'
import { createUser, deleteUser } from './helpers/auth'
import { createClient } from '@supabase/supabase-js'

const subtle = webcrypto.subtle
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

// Mirrors lib/encrypt-password-client.ts (browser WebCrypto flow)
async function encryptLikeBrowser(
  password: string,
  publicKeyB64: string,
  kid: string
): Promise<string> {
  const spki = Buffer.from(publicKeyB64, 'base64')
  const rsaKey = await subtle.importKey(
    'spki',
    spki,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
  const aesKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
  const iv = webcrypto.getRandomValues(new Uint8Array(12))
  const ciphertext = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(password))
  )
  const rawAesKey = new Uint8Array(await subtle.exportKey('raw', aesKey))
  const wrappedKey = new Uint8Array(await subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAesKey))

  const envelope = JSON.stringify({
    wk: toBase64(wrappedKey),
    iv: toBase64(iv),
    ct: toBase64(ciphertext),
    kid,
  })
  return 'encv1:' + Buffer.from(envelope).toString('base64')
}

async function isServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/public-key`, { signal: AbortSignal.timeout(3000) })
    return true
  } catch {
    return false
  }
}

describe('Auth password transport encryption', () => {
  const publicKeyB64 = process.env.AUTH_ENCRYPTION_PUBLIC_KEY || ''
  const privateKeyB64 = process.env.AUTH_ENCRYPTION_PRIVATE_KEY || ''

  beforeAll(() => {
    expect(publicKeyB64).not.toBe('')
    expect(privateKeyB64).not.toBe('')
  })

  test('decrypts a browser-style encrypted password', async () => {
    const password = '我的S3cret-P@ss!'
    const envelope = await encryptLikeBrowser(password, publicKeyB64, 'test-kid')
    expect(envelope.startsWith('encv1:')).toBe(true)
    expect(envelope).not.toContain(password)

    const decrypted = await decryptIncomingPassword(envelope)
    expect(decrypted).toBe(password)
  })

  test('passes plaintext through unchanged (legacy clients)', async () => {
    const decrypted = await decryptIncomingPassword('plainPassword123')
    expect(decrypted).toBe('plainPassword123')
  })

  test('rejects a tampered ciphertext', async () => {
    const envelope = await encryptLikeBrowser('secret123', publicKeyB64, 'test-kid')
    // Flip a byte inside the base64 envelope body
    const body = envelope.slice('encv1:'.length)
    const flipped = body.slice(0, 20) + (body[20] === 'A' ? 'B' : 'A') + body.slice(21)
    await expect(decryptIncomingPassword('encv1:' + flipped)).rejects.toThrow()
  })

  test('rejects an invalid envelope encoding', async () => {
    await expect(decryptIncomingPassword('encv1:not-base64!!!')).rejects.toThrow()
  })

  describe('live API (requires dev server)', () => {
    let serverAvailable = false

    beforeAll(async () => {
      serverAvailable = await isServerAvailable()
    })

    test('public-key endpoint serves the configured key', async () => {
      if (!serverAvailable) return
      const res = await fetch(`${BASE_URL}/api/auth/public-key`)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.publicKey).toBe(publicKeyB64)
      expect(data.kid).toMatch(/^[a-f0-9]{16}$/)
    })

    test('sign-in succeeds with an encrypted password', async () => {
      if (!serverAvailable) return

      const username = `enc-test-${Date.now()}`
      const password = 'Test1234pass'

      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })

      const testUser = await createUser({
        email: `${username}@test.local`,
        password,
      })

      try {
        // Give the test user a username + approved status in profiles
        const { error: profileError } = await admin
          .from('profiles')
          .update({ username, account_status: 'approved' })
          .eq('id', testUser.id)
        expect(profileError).toBeNull()

        const keyRes = await fetch(`${BASE_URL}/api/auth/public-key`)
        const keyInfo = await keyRes.json()
        const envelope = await encryptLikeBrowser(password, keyInfo.publicKey, keyInfo.kid)

        const res = await fetch(`${BASE_URL}/api/auth/sign-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: envelope }),
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)

        // Legacy plaintext sign-in must keep working
        const res2 = await fetch(`${BASE_URL}/api/auth/sign-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        expect(res2.status).toBe(200)
      } finally {
        await admin.from('profiles').delete().eq('id', testUser.id).then(() => {})
        await deleteUser(testUser.id)
      }
    }, 60000)
  })
})
