import * as React from "react"

const MOBILE_BREAKPOINT = 768

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  query.addEventListener("change", onChange)

  return () => query.removeEventListener("change", onChange)
}

export const useIsMobile = () =>
  React.useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false
  )
