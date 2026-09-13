"use client"

import { useQuery } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { useEffect, useMemo } from "react"

import { sortBookmarks, type OrderScope } from "@loomark/core/sort"
import type { BookmarkDTO } from "@loomark/core/types"

import { useBookmarkReorder } from "@/hooks/use-bookmark-reorder"
import { useSortOrder } from "@/hooks/use-sort-order"
import { bookmarkListQuery } from "@/lib/client/queries"
import type { BookmarkQuery } from "@/lib/query-keys"
import { activeBookmarkQueryAtom } from "@/store/atoms"

const NO_BOOKMARKS: BookmarkDTO[] = []

export const useBookmarkList = (
  query: BookmarkQuery,
  scope: OrderScope,
  collectionId: string | null = null
) => {
  const { data = NO_BOOKMARKS } = useQuery(bookmarkListQuery(query))
  const { order } = useSortOrder()
  const setActiveQuery = useSetAtom(activeBookmarkQueryAtom)
  const manual = order === "custom"

  useEffect(() => {
    setActiveQuery(query)

    return () => setActiveQuery(null)
  }, [query, setActiveQuery])

  useBookmarkReorder({ query, scope, collectionId, enabled: manual })

  return {
    manual,
    items: useMemo(
      () => sortBookmarks(data, order, scope),
      [data, order, scope]
    ),
  }
}
