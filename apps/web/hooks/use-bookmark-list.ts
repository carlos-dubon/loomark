"use client"

import { useAtom, useAtomValue } from "jotai"
import { useEffect, useMemo } from "react"

import { sortBookmarks } from "@loomark/core/sort"
import type { BookmarkDTO } from "@loomark/core/types"

import { bookmarkListAtom, sortOrderAtom } from "@/store/atoms"

export const useBookmarkList = (source: BookmarkDTO[]) => {
  const [list, setList] = useAtom(bookmarkListAtom)
  const order = useAtomValue(sortOrderAtom)

  useEffect(() => {
    setList({ source, items: source })
  }, [source, setList])

  const items = list.source === source ? list.items : source

  return useMemo(() => sortBookmarks(items, order), [items, order])
}
