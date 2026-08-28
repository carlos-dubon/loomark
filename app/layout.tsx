import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { Providers } from "@/components/providers"
import { ServiceWorker } from "@/components/service-worker"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const fontSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  applicationName: "Loomark",
  title: {
    default: "Loomark",
    template: "%s - Loomark",
  },
  description: "A self hosted home for everything you bookmark.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Loomark",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html
    lang="en"
    suppressHydrationWarning
    className={cn(
      "antialiased",
      fontMono.variable,
      "font-sans",
      fontSans.variable
    )}
  >
    <body>
      <Providers>{children}</Providers>
      <Toaster position="bottom-right" />
      <ServiceWorker />
    </body>
  </html>
)

export default RootLayout
