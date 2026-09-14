"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { ClockIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { hostFromUrl } from "@loomark/core/url"
import { Button } from "@loomark/ui/components/button"
import { Spinner } from "@loomark/ui/components/spinner"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@loomark/ui/components/command"

import { FaviconImage } from "@/components/favicon-image"
import { useOpenInNewTab } from "@/hooks/use-open-in-new-tab"
import { bookmarkListQuery } from "@/lib/client/queries"
import {
  clearRecentSearchesAtom,
  pushRecentSearchAtom,
  recentSearchesAtom,
  removeRecentSearchAtom,
  searchDialogAtom,
  searchQueryAtom,
} from "@/store/atoms"

const SEARCH_DEBOUNCE_MS = 200
const SEARCH_LIMIT = 20

export const BookmarkSearchDialog = () => {
  const [open, setOpen] = useAtom(searchDialogAtom)
  const [query, setQuery] = useAtom(searchQueryAtom)
  const [debounced, setDebounced] = useState("")
  const recents = useAtomValue(recentSearchesAtom)
  const pushRecent = useSetAtom(pushRecentSearchAtom)
  const removeRecent = useSetAtom(removeRecentSearchAtom)
  const clearRecents = useSetAtom(clearRecentSearchesAtom)
  const { open: openUrl } = useOpenInNewTab()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return
      if (!event.metaKey && !event.ctrlKey) return

      event.preventDefault()
      setOpen(true)
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [setOpen])

  useEffect(() => {
    if (!open) {
      setQuery("")
    }
  }, [open, setQuery])

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebounced(query.trim()),
      SEARCH_DEBOUNCE_MS
    )

    return () => clearTimeout(timeout)
  }, [query])

  const term = query.trim()

  const search = useQuery({
    ...bookmarkListQuery({ q: debounced, take: SEARCH_LIMIT }),
    enabled: debounced.length > 0,
    placeholderData: keepPreviousData,
  })

  const pending = term.length > 0 && (term !== debounced || search.isFetching)
  const results = search.isError ? [] : (search.data ?? null)

  const openBookmark = (url: string) => {
    pushRecent(query)
    setOpen(false)
    openUrl(url)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={false}
      title="Search for bookmarks"
      description="Search your bookmarks by title, url or description."
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search for bookmarks…"
      >
        {pending ? (
          <Spinner
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        ) : null}
      </CommandInput>
      <CommandList>
        {!term ? (
          recents.length === 0 ? (
            <CommandEmpty>Start typing to search your bookmarks.</CommandEmpty>
          ) : (
            <CommandGroup heading="Recent searches">
              {recents.map((recent) => (
                <CommandItem
                  key={recent}
                  value={`recent:${recent}`}
                  onSelect={() => setQuery(recent)}
                  className="group/recent"
                >
                  <ClockIcon className="text-muted-foreground" />
                  <span className="truncate">{recent}</span>
                  <Button
                    variant="ghost-muted"
                    size="icon-micro"
                    aria-label={`Remove ${recent} from recent searches`}
                    className="ml-auto opacity-0 group-data-[selected=true]/recent:opacity-100 focus-visible:opacity-100"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.stopPropagation()
                      removeRecent(recent)
                    }}
                  >
                    <XIcon />
                  </Button>
                </CommandItem>
              ))}
              <CommandItem
                value="recent:clear"
                onSelect={clearRecents}
                className="text-muted-foreground"
              >
                <XIcon />
                Clear recent searches
              </CommandItem>
            </CommandGroup>
          )
        ) : results === null ? (
          <CommandEmpty>Searching…</CommandEmpty>
        ) : results.length === 0 ? (
          <CommandEmpty>No bookmarks match “{term}”.</CommandEmpty>
        ) : (
          <CommandGroup heading="Bookmarks">
            {results.map((bookmark) => (
              <CommandItem
                key={bookmark.id}
                value={bookmark.id}
                onSelect={() => openBookmark(bookmark.url)}
              >
                <FaviconImage src={bookmark.faviconUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    {bookmark.title || hostFromUrl(bookmark.url)}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {hostFromUrl(bookmark.url)}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
