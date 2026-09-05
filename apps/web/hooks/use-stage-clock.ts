"use client"

import { useEffect, useState } from "react"

const TICK_MS = 400

export const useStageClock = (key: string, running: boolean) => {
  const [tick, setTick] = useState({ key, elapsed: 0 })

  useEffect(() => {
    if (!running) {
      return
    }

    const startedAt = Date.now()
    const timer = setInterval(
      () => setTick({ key, elapsed: Date.now() - startedAt }),
      TICK_MS
    )

    return () => clearInterval(timer)
  }, [key, running])

  return tick.key === key ? tick.elapsed : 0
}
