"use client"

import { HydrationBoundary } from "@tanstack/react-query"
import { useState } from "react"

import { HomeView } from "@/components/views/home-view"
import { seedBookmarkLists } from "@/lib/client/demo/queries"
import { getState } from "@/lib/client/demo/store"
import { LIBRARY_PROBE, PINNED_BOOKMARKS } from "@/lib/query-keys"

export const DemoHome = () => {
  const [seed] = useState(() =>
    seedBookmarkLists(getState(), [PINNED_BOOKMARKS, LIBRARY_PROBE])
  )

  return (
    <HydrationBoundary state={seed}>
      <HomeView />
    </HydrationBoundary>
  )
}
