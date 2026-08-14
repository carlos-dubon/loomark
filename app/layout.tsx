import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "tana",
  description: "A self hosted shelf for everything you bookmark.",
}

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="en" suppressHydrationWarning>
    <body>{children}</body>
  </html>
)

export default RootLayout
