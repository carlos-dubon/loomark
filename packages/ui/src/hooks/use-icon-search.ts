"use client"

import { type IconName } from "lucide-react/dynamic"
import { useMemo, useRef, useState } from "react"

import { isIconName } from "../components/collection-icon"
import type { IconGridHandle } from "../components/icon-grid"
import { iconNames, searchIcons, SUGGESTED_ICONS } from "../lib/icons"

export const useIconSearch = (value: string | null) => {
  const [query, setQuery] = useState("")
  const [initialValue] = useState(() => (isIconName(value) ? value : null))
  const gridRef = useRef<IconGridHandle | null>(null)

  const results = useMemo<IconName[]>(() => {
    const trimmed = query.trim()

    if (trimmed) {
      return searchIcons(trimmed)
    }

    const pinned = initialValue
      ? [
          initialValue,
          ...SUGGESTED_ICONS.filter((name) => name !== initialValue),
        ]
      : SUGGESTED_ICONS
    const seen = new Set(pinned)

    return [...pinned, ...iconNames.filter((name) => !seen.has(name))]
  }, [query, initialValue])

  const onQueryChange = (next: string) => {
    setQuery(next)
    gridRef.current?.scrollToTop()
  }

  return { query, onQueryChange, results, gridRef }
}
