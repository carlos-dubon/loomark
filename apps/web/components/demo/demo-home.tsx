"use client"

import { HomeView } from "@/components/home-view"
import { useDemoState } from "@/hooks/use-demo-state"
import { pinnedBookmarks } from "@/lib/demo/store"

export const DemoHome = () => {
  const state = useDemoState()

  return (
    <HomeView
      pinned={pinnedBookmarks(state)}
      bookmarkCount={state.bookmarks.length}
    />
  )
}
