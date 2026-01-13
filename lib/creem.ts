import 'server-only'

/**
 * Creem Payment helpers (server-only).
 */

export interface CreemPaymentLink {
  url: string
  priceId: string
}

// Pre-configured payment links from Creem Dashboard
export const CREEM_PAYMENT_LINKS = {
  pro: process.env.CREEM_PRO_PAYMENT_LINK || '',
}

type CreemEnvironment = 'test' | 'live'

function getCreemEnvironment(): CreemEnvironment {
  // Heuristic: official keys are prefixed; allow explicit override via env if added later.
  const apiKey = process.env.CREEM_API_KEY || ''
  if (apiKey.startsWith('creem_test_')) return 'test'
  if (apiKey.startsWith('creem_live_')) return 'live'
  return process.env.NODE_ENV === 'production' ? 'live' : 'test'
}

export function getCreemApiBaseUrl(): string {
  const env = getCreemEnvironment()
  return env === 'test' ? 'https://test-api.creem.io' : 'https://api.creem.io'
}

// Generate payment link with user metadata
export function generatePaymentLink(
  priceId: string,
  userId?: string,
  userEmail?: string
): string {
  const baseUrl = CREEM_PAYMENT_LINKS[priceId as keyof typeof CREEM_PAYMENT_LINKS]

  if (!baseUrl) {
    throw new Error(`Payment link not found for price: ${priceId}`)
  }

  // Add user metadata to the link for webhook processing
  const url = new URL(baseUrl)
  if (userId) {
    url.searchParams.set('user_id', userId)
  }
  if (userEmail) {
    url.searchParams.set('user_email', userEmail)
  }

  // Add success and cancel URLs
  url.searchParams.set('success_url', `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?payment=success`)
  url.searchParams.set('cancel_url', `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?payment=cancelled`)

  return url.toString()
}

// Verify webhook signature
export function verifyCreemWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Creem signs the raw request body with HMAC-SHA256 (hex) and sends it in `creem-signature`.
    // Docs also show the header value can contain spaces/newlines when copied; trim and normalize.
    // Additionally support "v1=<hex>" style headers defensively.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto') as typeof import('crypto')

    const extracted =
      /v1=([0-9a-f]{64})/i.exec(signature)?.[1] ?? signature.trim().replace(/\s+/g, '')

    if (!/^[0-9a-f]{64}$/i.test(extracted)) return false

    const expectedHex = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')

    const expected = Buffer.from(expectedHex, 'hex')
    const received = Buffer.from(extracted, 'hex')
    if (expected.length !== received.length) return false

    return crypto.timingSafeEqual(received, expected)
  } catch {
    return false
  }
}

export interface CreateCreemCheckoutParams {
  productId: string
  requestId: string
  successUrl: string
  customerEmail?: string
  metadata?: Record<string, unknown>
}

export interface CreemCheckout {
  id: string
  checkout_url: string
}

export async function createCreemCheckout(
  params: CreateCreemCheckoutParams
): Promise<CreemCheckout> {
  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) throw new Error('CREEM_API_KEY is not configured')

  const baseUrl = getCreemApiBaseUrl()
  const res = await fetch(`${baseUrl}/v1/checkouts`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      product_id: params.productId,
      request_id: params.requestId,
      success_url: params.successUrl,
      customer: params.customerEmail
        ? { email: params.customerEmail }
        : undefined,
      metadata: params.metadata,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Creem create checkout failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as Partial<CreemCheckout>
  if (!data.id || !data.checkout_url) {
    throw new Error('Creem create checkout returned an unexpected response')
  }

  return { id: data.id, checkout_url: data.checkout_url }
}
