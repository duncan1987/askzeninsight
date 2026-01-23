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
  annual: process.env.CREEM_ANNUAL_PAYMENT_LINK || '',
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
  priceId: 'pro' | 'annual',
  userId?: string,
  userEmail?: string,
  siteUrl?: string
): string {
  const baseUrl = CREEM_PAYMENT_LINKS[priceId as keyof typeof CREEM_PAYMENT_LINKS]

  if (!baseUrl) {
    throw new Error(`Payment link not found for price: ${priceId}`)
  }

  // Add user metadata to link for webhook processing
  const url = new URL(baseUrl)
  if (userId) {
    url.searchParams.set('user_id', userId)
  }
  if (userEmail) {
    url.searchParams.set('user_email', userEmail)
  }

  // Add plan metadata for webhook processing
  url.searchParams.set('plan', priceId)
  url.searchParams.set('interval', priceId === 'annual' ? 'year' : 'month')

  // Add success and cancel URLs
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  url.searchParams.set('success_url', `${baseUrl}/dashboard?payment=success`)
  url.searchParams.set('cancel_url', `${baseUrl}/pricing?payment=cancelled`)

  return url.toString()
}

// Verify webhook signature
export function verifyCreemWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Creem signs on raw request body with HMAC-SHA256 (hex) and sends it in `creem-signature`.
    // Docs also show that header value can contain spaces/newlines when copied; trim and normalize.
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

export interface CreemCustomer {
  id: string
  email: string
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

export async function getCreemCustomerByEmail(
  email: string
): Promise<CreemCustomer | null> {
  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) throw new Error('CREEM_API_KEY is not configured')

  const baseUrl = getCreemApiBaseUrl()
  const url = new URL(`${baseUrl}/v1/customers`)
  url.searchParams.set('email', email)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Creem get customer failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as Partial<CreemCustomer> | null
  if (!data?.id || !data.email) return null
  return { id: data.id, email: data.email }
}

export async function createCreemCustomerPortalLink(
  customerId: string
): Promise<string> {
  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) throw new Error('CREEM_API_KEY is not configured')

  const baseUrl = getCreemApiBaseUrl()
  const res = await fetch(`${baseUrl}/v1/customers/billing`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ customer_id: customerId }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Creem create billing portal failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as { customer_portal_link?: string }
  if (!data.customer_portal_link) {
    throw new Error('Creem billing portal returned an unexpected response')
  }

  return data.customer_portal_link
}

export interface CancelSubscriptionParams {
  subscriptionId: string
  mode?: 'immediate' | 'scheduled'
}

export interface CreemSubscription {
  id: string
  status: string
  current_period_end_date: string
  canceled_at?: string | null
}

export async function cancelSubscription(
  params: CancelSubscriptionParams
): Promise<CreemSubscription> {
  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) throw new Error('CREEM_API_KEY is not configured')

  const baseUrl = getCreemApiBaseUrl()
  const res = await fetch(`${baseUrl}/v1/subscriptions/${params.subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      mode: params.mode || 'scheduled', // scheduled: cancel at period end, immediate: cancel now
      onExecute: 'cancel',
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Creem cancel subscription failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as Partial<CreemSubscription>
  if (!data.id || !data.status) {
    throw new Error('Creem cancel subscription returned an unexpected response')
  }

  return {
    id: data.id,
    status: data.status,
    current_period_end_date: data.current_period_end_date || '',
    canceled_at: data.canceled_at,
  }
}
