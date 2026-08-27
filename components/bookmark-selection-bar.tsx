"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { Trash2Icon, XIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { useBookmarkSelection } from "@/hooks/use-bookmark-selection"
import { bookmarkListAtom, deleteDialogAtom } from "@/store/atoms"

export const BookmarkSelectionBar = () => {
  const { count, selected, clear, selectAll } = useBookmarkSelection()
  const list = useAtomValue(bookmarkListAtom)
  const confirmDelete = useSetAtom(deleteDialogAtom)
  const pathname = usePathname()

  useEffect(() => {
    clear()
  }, [pathname, clear])

  useEffect(() => {
    if (count === 0) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        clear()
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [count, clear])

  if (count === 0) {
    return null
  }

  const allSelected = count >= list.items.length && list.items.length > 0

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-popover/95 p-1 pl-3 text-popover-foreground shadow-lg backdrop-blur">
        <span className="text-sm font-medium tabular-nums">
          {count} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 rounded-full"
          disabled={allSelected}
          onClick={() => selectAll(list.items)}
        >
          Select all
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="rounded-full"
          onClick={() =>
            confirmDelete(list.items.filter((item) => selected.has(item.id)))
          }
        >
          <Trash2Icon />
          Delete {count === 1 ? "bookmark" : "bookmarks"}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Clear selection"
          className="rounded-full"
          onClick={clear}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
