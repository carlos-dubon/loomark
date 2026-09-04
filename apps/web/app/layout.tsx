import type { Metadata, Viewport } from "next"

import "./globals.css"

import { Toaster } from "@loomark/ui/components/sonner"

import { Providers } from "@/components/providers"
import { ServiceWorker } from "@/components/service-worker"

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
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="en" suppressHydrationWarning className="font-sans antialiased">
    <body>
      <Providers>{children}</Providers>
      <Toaster position="bottom-right" />
      <ServiceWorker />
    </body>
  </html>
)

export default RootLayout
