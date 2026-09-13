"use client"

import { useQuery } from "@tanstack/react-query"
import { useAtomValue, useSetAtom } from "jotai"
import { Trash2Icon, XIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { Button } from "@loomark/ui/components/button"

import { useBookmarkSelection } from "@/hooks/use-bookmark-selection"
import { bookmarkListQuery } from "@/lib/client/queries"
import { activeBookmarkQueryAtom, deleteDialogAtom } from "@/store/atoms"

export const BookmarkSelectionBar = () => {
  const { count, selected, clear, selectAll } = useBookmarkSelection()
  const activeQuery = useAtomValue(activeBookmarkQueryAtom)
  const { data: items = [] } = useQuery({
    ...bookmarkListQuery(activeQuery ?? {}),
    enabled: activeQuery !== null,
  })
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

  const allSelected = count >= items.length && items.length > 0

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
          onClick={() => selectAll(items)}
        >
          Select all
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="rounded-full"
          onClick={() =>
            confirmDelete(items.filter((item) => selected.has(item.id)))
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
