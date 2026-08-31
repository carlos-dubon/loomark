"use client"

import { useSyncExternalStore } from "react"

const COARSE_POINTER = "(pointer: coarse)"

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(COARSE_POINTER)
  query.addEventListener("change", onChange)

  return () => query.removeEventListener("change", onChange)
}

export const useCoarsePointer = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(COARSE_POINTER).matches,
    () => false
  )
