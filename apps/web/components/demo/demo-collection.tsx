"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { BookmarkListView } from "@/components/bookmark-list-view"
import { useDemoState } from "@/hooks/use-demo-state"
import { collectionEmptyState } from "@/lib/collection-view"
import { bookmarksIn, collectionList } from "@/lib/demo/store"

export const DemoCollection = ({ id }: { id: string }) => {
  const state = useDemoState()
  const router = useRouter()
  const collections = collectionList(state)
  const collection = collections.find((item) => item.id === id)

  useEffect(() => {
    if (!collection) {
      router.replace("/")
    }
  }, [collection, router])

  if (!collection) {
    return null
  }

  return (
    <BookmarkListView
      title={collection.name}
      collectionId={collection.id}
      collection={collection}
      bookmarks={bookmarksIn(state, collection.id)}
      {...collectionEmptyState(collection)}
    />
  )
}
