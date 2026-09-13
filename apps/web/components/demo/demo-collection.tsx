"use client"

import { HydrationBoundary } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"

import { BookmarkListView } from "@/components/views/bookmark-list-view"
import { useDemoState } from "@/hooks/use-demo-state"
import { seedBookmarkLists } from "@/lib/client/demo/queries"
import { getState } from "@/lib/client/demo/store"
import { collectionBookmarks } from "@/lib/query-keys"

export const DemoCollection = ({ id }: { id: string }) => {
  const state = useDemoState()
  const router = useRouter()
  const exists = state.collections.some((item) => item.id === id)

  const seed = useMemo(
    () => seedBookmarkLists(getState(), [collectionBookmarks(id)]),
    [id]
  )

  useEffect(() => {
    if (!exists) {
      router.replace("/")
    }
  }, [exists, router])

  if (!exists) {
    return null
  }

  return (
    <HydrationBoundary state={seed}>
      <BookmarkListView collectionId={id} />
    </HydrationBoundary>
  )
}
