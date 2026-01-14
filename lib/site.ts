import 'server-only'

export interface SiteConfig {
  siteName: string
  legalName: string
  supportEmail: string
  businessAddress?: string
}

export function getSiteConfig(): SiteConfig {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Ask Zen Insight'
  const legalName = process.env.NEXT_PUBLIC_BUSINESS_LEGAL_NAME || siteName
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@zeninsight.xyz'
  const businessAddress = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS

  return {
    siteName,
    legalName,
    supportEmail,
    businessAddress,
  }
}

