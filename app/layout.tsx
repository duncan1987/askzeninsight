import type React from "react"
import type { Metadata } from "next"
import { Inter, Crimson_Text } from "next/font/google"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
})

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Ask Zen Insight"

export const metadata: Metadata = {
  title: `${siteName} - AI-Powered Spiritual Guidance`,
  description:
    "Receive thoughtful spiritual guidance and Zen wisdom through AI-powered conversations. Explore mindfulness, meditation, and inner peace.",
  generator: "v0.app",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ask.zeninsight.xyz"),
  keywords: [
    "zen",
    "meditation",
    "mindfulness",
    "spiritual guidance",
    "AI meditation teacher",
    "buddhism",
    "inner peace",
    "mental wellness",
    "zen philosophy",
    "meditation coach",
  ],
  authors: [{ name: "Ask Zen Insight" }],
  creator: "Ask Zen Insight",
  publisher: "Ask Zen Insight",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: `${siteName} - AI-Powered Spiritual Guidance`,
    description: "Discover inner wisdom through mindful conversation with our AI meditation teacher koji (Emptiness and Stillness). Experience gentle, non-judgmental guidance grounded in Zen philosophy.",
    siteName: siteName,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: `${siteName} - AI-Powered Spiritual Guidance`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - AI-Powered Spiritual Guidance`,
    description: "Discover inner wisdom through mindful conversation with our AI meditation teacher. Experience gentle, non-judgmental guidance grounded in Zen philosophy.",
    images: ["/og-image.svg"],
    creator: "@zeninsight_ai",
    site: "@zeninsight_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-K0GGL4GQDV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-K0GGL4GQDV');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} ${crimsonText.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: Infinity, // Requires manual dismissal
            closeButton: true,
          }}
        />
      </body>
    </html>
  )
}
