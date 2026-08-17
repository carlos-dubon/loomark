"use client"

import { SessionProvider } from "next-auth/react"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider>
    <ThemeProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  </SessionProvider>
)
