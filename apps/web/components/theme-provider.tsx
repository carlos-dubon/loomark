"use client"

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

import { useThemeToggle } from "@/hooks/use-theme-toggle"
import {
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  toThemeMode,
} from "@/lib/theme-mode"
import { useEffect } from "react"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      <ThemeCookie />
      {children}
    </NextThemesProvider>
  )
}

const ThemeCookie = () => {
  const { theme } = useTheme()

  useEffect(() => {
    if (theme) {
      document.cookie = `${THEME_COOKIE_NAME}=${toThemeMode(theme)}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`
    }
  }, [theme])

  return null
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const toggleTheme = useThemeToggle()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      toggleTheme()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [toggleTheme])

  return null
}

export { ThemeProvider }
