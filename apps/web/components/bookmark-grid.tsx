"use client"

import type { BookmarkDTO } from "@loomark/core/types"
import type { ViewMode } from "@loomark/core/view-mode"

import { BookmarkCard } from "@/components/bookmark-card"

export const BookmarkGrid = ({
  bookmarks,
  mode,
  manual,
}: {
  bookmarks: BookmarkDTO[]
  mode: ViewMode
  manual: boolean
}) =>
  mode === "grid" ? (
    <div className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
      {bookmarks.map((bookmark, index) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          mode="grid"
          index={index}
          manual={manual}
        />
      ))}
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      {bookmarks.map((bookmark, index) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          mode="list"
          index={index}
          manual={manual}
        />
      ))}
    </div>
  )
