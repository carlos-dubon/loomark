"use client"

import { useState } from "react"

export const useRemountKey = (open: boolean) => {
  const [key, setKey] = useState(0)
  const [wasOpen, setWasOpen] = useState(open)

  if (wasOpen !== open) {
    setWasOpen(open)

    if (open) {
      setKey((value) => value + 1)
    }
  }

  return key
}
