import { createPrivateKey, privateDecrypt, createDecipheriv, createHash } from 'crypto'

// Wire format produced by lib/encrypt-password-client.ts:
//   encv1:<base64(JSON{ wk, iv, ct, kid })>
//   wk = RSA-OAEP(SHA-256) wrapped AES-256 key
//   ct = AES-256-GCM ciphertext||tag
//   iv = 12-byte GCM IV
//   kid = key id (first 16 hex chars of SHA-256 of the public key)
const ENVELOPE_PREFIX = 'encv1:'

export interface AuthPublicKeyInfo {
  publicKey: string
  kid: string
}

export function getAuthPublicKeyInfo(): AuthPublicKeyInfo | null {
  const publicKeyB64 = process.env.AUTH_ENCRYPTION_PUBLIC_KEY
  if (!publicKeyB64) return null
  return {
    publicKey: publicKeyB64,
    kid: createHash('sha256').update(publicKeyB64).digest('hex').slice(0, 16),
  }
}

/**
 * Decrypt an incoming password field.
 * - Values without the envelope prefix are returned unchanged (legacy
 *   plaintext clients, tests, curl). HTTPS still protects those.
 * - Encrypted values are unwrapped with the server private key.
 * Throws if an encrypted value arrives while no private key is configured.
 */
export async function decryptIncomingPassword(incoming: string): Promise<string> {
  if (!incoming || !incoming.startsWith(ENVELOPE_PREFIX)) {
    return incoming
  }

  const privateKeyB64 = process.env.AUTH_ENCRYPTION_PRIVATE_KEY
  if (!privateKeyB64) {
    throw new Error('Encrypted password received but AUTH_ENCRYPTION_PRIVATE_KEY is not configured')
  }

  let payload: { wk: string; iv: string; ct: string; kid?: string }
  try {
    payload = JSON.parse(Buffer.from(incoming.slice(ENVELOPE_PREFIX.length), 'base64').toString('utf8'))
  } catch {
    throw new Error('Invalid password envelope encoding')
  }

  if (!payload.wk || !payload.iv || !payload.ct) {
    throw new Error('Invalid password envelope payload')
  }

  const privateKey = createPrivateKey({
    key: Buffer.from(privateKeyB64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  })

  const aesKey = privateDecrypt({ key: privateKey, oaepHash: 'sha256' }, Buffer.from(payload.wk, 'base64'))

  const data = Buffer.from(payload.ct, 'base64')
  if (data.length < 16) {
    throw new Error('Invalid password envelope ciphertext')
  }
  const tag = data.subarray(data.length - 16)
  const ciphertext = data.subarray(0, data.length - 16)

  const decipher = createDecipheriv('aes-256-gcm', aesKey, Buffer.from(payload.iv, 'base64'))
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  return plaintext.toString('utf8')
}
