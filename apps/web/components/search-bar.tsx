"use client"

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react"
import * as React from "react"
import { useEffect, useRef } from "react"

import { Button } from "@loomark/ui/components/button"
import { Input } from "@loomark/ui/components/input"

export const SearchBar = ({
  value,
  onValueChange,
  pending,
}: {
  value: string
  onValueChange: (value: string) => void
  pending: boolean
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        document.activeElement === inputRef.current
      ) {
        inputRef.current?.blur()
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onValueChange(event.target.value)
        }
        placeholder="Search bookmarks by title or url…"
        aria-label="Search bookmarks"
        className="h-11 rounded-xl pr-10 pl-9 text-base"
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {pending ? (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ) : null}
        {value ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            onClick={() => onValueChange("")}
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
