"use client"

import { useAtom, useAtomValue } from "jotai"
import { useEffect, useMemo } from "react"

import { sortBookmarks, type OrderScope } from "@loomark/core/sort"
import type { BookmarkDTO } from "@loomark/core/types"

import { useBookmarkReorder } from "@/hooks/use-bookmark-reorder"
import { bookmarkListAtom, sortOrderAtom } from "@/store/atoms"

export const useBookmarkList = (
  source: BookmarkDTO[],
  scope: OrderScope,
  collectionId: string | null = null
) => {
  const [list, setList] = useAtom(bookmarkListAtom)
  const order = useAtomValue(sortOrderAtom)
  const manual = order === "custom"

  useEffect(() => {
    setList({ source, items: source })
  }, [source, setList])

  const items = list.source === source ? list.items : source

  useBookmarkReorder({ scope, collectionId, enabled: manual })

  return {
    manual,
    items: useMemo(
      () => sortBookmarks(items, order, scope),
      [items, order, scope]
    ),
  }
}
