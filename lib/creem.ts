/**
 * Creem Payment Configuration
 * Uses payment links for simple subscription checkout
 */

export interface CreemPaymentLink {
  url: string
  priceId: string
}

// Pre-configured payment links from Creem Dashboard
export const CREEM_PAYMENT_LINKS = {
  pro: process.env.CREEM_PRO_PAYMENT_LINK || '',
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
  // Creem webhook verification logic
  // This is a placeholder - actual implementation depends on Creem's webhook signing method
  try {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const digest = hmac.digest('hex')
    return signature === digest
  } catch {
    return false
  }
}
