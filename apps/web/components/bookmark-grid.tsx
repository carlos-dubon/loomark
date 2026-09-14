"use client"

import type { BookmarkDTO } from "@loomark/core/types"
import type { GridColumns, ViewMode } from "@loomark/core/view-mode"

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
  columns: GridColumns
  manual: boolean
}) => {
  useBookmarkDragStack()

  return mode === "grid" ? (
    <div
      className="grid-fill"
      data-columns={columns}
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
