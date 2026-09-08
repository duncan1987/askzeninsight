// Client-side password transport encryption (hybrid RSA-OAEP + AES-256-GCM).
// Hides the plaintext password from request-body logs; TLS remains the
// primary transport protection. Any failure falls back to plaintext so
// sign-in never breaks because of this layer.

const ENVELOPE_PREFIX = 'encv1:'

let cachedKeyInfo: { publicKey: string; kid: string } | null = null

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function fetchPublicKey(): Promise<{ publicKey: string; kid: string } | null> {
  if (cachedKeyInfo) return cachedKeyInfo
  try {
    const res = await fetch('/api/auth/public-key')
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.publicKey || !data?.kid) return null
    cachedKeyInfo = { publicKey: data.publicKey, kid: data.kid }
    return cachedKeyInfo
  } catch {
    return null
  }
}

/**
 * Encrypt a password for transport when the server exposes a public key.
 * Returns the original plaintext on any failure (legacy behavior).
 */
export async function encryptPasswordForTransport(password: string): Promise<string> {
  try {
    const subtle = globalThis.crypto?.subtle
    if (!subtle || !password) return password

    const keyInfo = await fetchPublicKey()
    if (!keyInfo) return password

    const binaryKey = atob(keyInfo.publicKey)
    const spki = new Uint8Array(binaryKey.length)
    for (let i = 0; i < binaryKey.length; i++) {
      spki[i] = binaryKey.charCodeAt(i)
    }

    const rsaKey = await subtle.importKey(
      'spki',
      spki,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    )

    const aesKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = new Uint8Array(
      await subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(password))
    )
    const rawAesKey = new Uint8Array(await subtle.exportKey('raw', aesKey))
    const wrappedKey = new Uint8Array(await subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAesKey))

    const envelope = JSON.stringify({
      wk: toBase64(wrappedKey),
      iv: toBase64(iv),
      ct: toBase64(ciphertext),
      kid: keyInfo.kid,
    })

    return ENVELOPE_PREFIX + btoa(envelope)
  } catch {
    return password
  }
}
