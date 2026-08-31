"use client"

import { Provider as JotaiProvider } from "jotai"
import { SessionProvider } from "next-auth/react"

import { TooltipProvider } from "@loomark/ui/components/tooltip"

import { ThemeProvider } from "@/components/theme-provider"

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider>
    <JotaiProvider>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </JotaiProvider>
  </SessionProvider>
)
