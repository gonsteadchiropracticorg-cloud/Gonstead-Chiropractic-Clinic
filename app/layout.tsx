import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from "@/components/language-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import AnalyticsProvider from "@/components/AnalyticsProvider.optimized"
import AntiScraping from "@/components/AntiScraping"

export const metadata: Metadata = {
  metadataBase: new URL("https://gonsteadchiropractic.vercel.app/"),
  title: "Dr. Bashir - Gonstead Certified Specialist V | Advanced Chiropractic Care",
  description:
    "Expert Gonstead chiropractic care by Dr. Bashir. Certified Specialist Level V with advanced machine-assisted spinal alignment. Precision treatment with cutting-edge technology.",
  keywords:
    "gonstead chiropractic, dr bashir, certified specialist, spinal alignment, chiropractic clinic, machine assisted treatment, video consultation, emergency chiropractic care, patient dashboard, doctor dashboard",
  authors: [{ name: "Dr. Bashir", url: "https://gonsteadchiropractic.vercel.app/" }],
  creator: "Dr. Bashir",
  publisher: "Gonstead Chiropractic Clinic",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gonsteadchiropractic.vercel.app/",
    title: "Dr. Bashir - Gonstead Certified Specialist V",
    description:
      "Expert Gonstead chiropractic care with advanced machine-assisted treatment and precision spinal alignment.",
    siteName: "Dr. Bashir Gonstead Chiropractic",
    images: [
      {
        url: "/images/gonstead-chiropractic-logo-new.png",
        width: 1200,
        height: 630,
        alt: "Dr. Bashir Gonstead Chiropractic Clinic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr. Bashir - Gonstead Certified Specialist V",
    description:
      "Expert Gonstead chiropractic care with advanced machine-assisted treatment and precision spinal alignment.",
    images: ["/images/gonstead-chiropractic-logo-new.png"],
    creator: "@drbashir_gonstead",
  },
  icons: {
    icon: [
      { url: "/images/gonstead-logo-new.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/images/gonstead-logo-new.ico", sizes: "16x16", type: "image/x-icon" },
    ],
    shortcut: "/images/gonstead-logo-new.ico",
    apple: [{ url: "/images/gonstead-chiropractic-logo-new.png", sizes: "180x180", type: "image/png" }],
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <link rel="icon" href="/images/gonstead-logo-new.ico" />
        <link rel="apple-touch-icon" href="/images/gonstead-chiropractic-logo-new.png" />
        <meta name="theme-color" content="#0d5c75" />
        <meta name="mobile-web-app-capable" content="no" />
        <meta name="apple-mobile-web-app-capable" content="no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider>
            <AnalyticsProvider>
              <AntiScraping />
              {children}
            </AnalyticsProvider>
            <Toaster />
            <SpeedInsights />
            <Analytics />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
