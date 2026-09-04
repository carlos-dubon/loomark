"use client"

import { useAtom, useSetAtom } from "jotai"
import { SearchIcon } from "lucide-react"
import { useEffect, useRef } from "react"

import { searchDialogAtom, searchQueryAtom } from "@/store/atoms"

export const MobileSearchBar = () => {
  const [open, setOpen] = useAtom(searchDialogAtom)
  const setQuery = useSetAtom(searchQueryAtom)
  const returning = useRef(false)

  useEffect(() => {
    if (open) {
      returning.current = true
    }
  }, [open])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pt-8 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value=""
          aria-label="Search for bookmarks"
          placeholder="Search for bookmarks…"
          className="h-12 w-full rounded-full border border-input bg-background pr-4 pl-10 text-base text-foreground shadow-lg outline-none placeholder:text-muted-foreground dark:bg-input/32 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          onFocus={(event) => {
            if (open || !returning.current) {
              return
            }

            returning.current = false
            event.currentTarget.blur()
          }}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
        />
      </div>
    </div>
  )
}
