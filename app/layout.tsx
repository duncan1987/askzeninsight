import type React from "react"
import type { Metadata } from "next"
import { Inter, Crimson_Text } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${crimsonText.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
