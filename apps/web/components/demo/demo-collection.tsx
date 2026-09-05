"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"

import { BookmarkListView } from "@/components/bookmark-list-view"
import { useDemoState } from "@/hooks/use-demo-state"
import { bookmarksIn, collectionList } from "@/lib/demo/store"

export const DemoCollection = ({ id }: { id: string }) => {
  const state = useDemoState()
  const router = useRouter()
  const collections = collectionList(state)
  const collection = collections.find((item) => item.id === id)

  const subcollections = useMemo(
    () =>
      collection?.kind === "UNSORTED"
        ? []
        : collections.filter((item) => item.parentId === id),
    [collections, collection?.kind, id]
  )

  useEffect(() => {
    if (!collection) {
      router.replace("/")
    }
  }, [collection, router])

  if (!collection) {
    return null
  }

  const unsorted = collection.kind === "UNSORTED"

  return (
    <BookmarkListView
      title={collection.name}
      collectionId={collection.id}
      collection={collection}
      bookmarks={bookmarksIn(state, collection.id)}
      subcollections={subcollections}
      emptyIcon={unsorted ? "inbox" : "bookmark"}
      emptyTitle={unsorted ? "Nothing unsorted" : "This collection is empty"}
      emptyDescription={
        unsorted
          ? "Every bookmark you saved already lives in a collection."
          : "Add a bookmark here or drop one in from another collection."
      }
    />
  )
}
