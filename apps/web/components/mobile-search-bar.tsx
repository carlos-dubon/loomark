"use client"

import { useSetAtom } from "jotai"
import { SearchIcon } from "lucide-react"

import { Button } from "@loomark/ui/components/button"

import { searchDialogAtom } from "@/store/atoms"

export const MobileSearchBar = () => {
  const setOpen = useSetAtom(searchDialogAtom)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pt-8 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))] md:hidden">
      <Button
        variant="outline"
        aria-haspopup="dialog"
        className="pointer-events-auto h-12 w-full justify-start gap-2.5 rounded-full px-4.5 text-base font-normal text-muted-foreground shadow-lg before:rounded-full sm:h-12 sm:text-base"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4" />
        Search for bookmarks…
      </Button>
    </div>
  )
}
