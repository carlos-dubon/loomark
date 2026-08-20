"use client"

import { BookmarkCard } from "@/components/bookmark-card"
import type { BookmarkDTO } from "@/lib/types"
import type { ViewMode } from "@/store/atoms"

export const BookmarkGrid = ({
  bookmarks,
  mode,
}: {
  bookmarks: BookmarkDTO[]
  mode: ViewMode
}) =>
  mode === "grid" ? (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
