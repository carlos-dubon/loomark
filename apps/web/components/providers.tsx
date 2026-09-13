"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { Provider as JotaiProvider } from "jotai"
import { SessionProvider } from "next-auth/react"

import { TooltipProvider } from "@loomark/ui/components/tooltip"

import { ThemeProvider } from "@/components/theme-provider"
import { getQueryClient } from "@/lib/query-client"

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={getQueryClient()}>
    <SessionProvider>
      <JotaiProvider>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </JotaiProvider>
    </SessionProvider>
  </QueryClientProvider>
)
