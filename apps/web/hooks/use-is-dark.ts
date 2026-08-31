"use client"

import { useSyncExternalStore } from "react"

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange)

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })

  return () => observer.disconnect()
}

const getSnapshot = () => document.documentElement.classList.contains("dark")

export const useIsDark = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => false)
