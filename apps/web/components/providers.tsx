"use client"

import { Provider as JotaiProvider } from "jotai"
import { SessionProvider } from "next-auth/react"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider>
    <JotaiProvider>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </JotaiProvider>
  </SessionProvider>
)
