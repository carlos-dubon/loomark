"use client"

import { BookmarkCard } from "@/components/bookmark-card"
import type { BookmarkDTO } from "@/lib/types"
import type { ViewMode } from "@/lib/view-mode"

export const BookmarkGrid = ({
  bookmarks,
  mode,
}: {
  bookmarks: BookmarkDTO[]
  mode: ViewMode
}) =>
  mode === "grid" ? (
    <div className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} mode="grid" />
      ))}
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      {bookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} mode="list" />
      ))}
    </div>
  )
