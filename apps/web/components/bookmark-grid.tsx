"use client"

import type { BookmarkDTO } from "@loomark/core/types"
import type { ViewMode } from "@loomark/core/view-mode"

import { BookmarkCard } from "@/components/bookmark-card"
import { useBookmarkDragStack } from "@/hooks/use-bookmark-drag-stack"

export const BookmarkGrid = ({
  bookmarks,
  mode,
  columns,
  manual,
}: {
  bookmarks: BookmarkDTO[]
  mode: ViewMode
  columns: number
  manual: boolean
}) => {
  useBookmarkDragStack()

  return mode === "grid" ? (
    <div
      className="grid-fill"
      style={{ "--grid-columns": columns } as React.CSSProperties}
    >
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
}
