"use client"

import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { ClockIcon, Loader2Icon, XIcon } from "lucide-react"
import { useEffect } from "react"

import { hostFromUrl } from "@loomark/core/url"
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
import { api } from "@/lib/client-api"
import {
  clearRecentSearchesAtom,
  pushRecentSearchAtom,
  recentSearchesAtom,
  removeRecentSearchAtom,
  searchDialogAtom,
  searchPendingAtom,
  searchQueryAtom,
  searchResultsAtom,
} from "@/store/atoms"

const SEARCH_DEBOUNCE_MS = 200
const SEARCH_LIMIT = 20

export const BookmarkSearchDialog = () => {
  const [open, setOpen] = useAtom(searchDialogAtom)
  const [query, setQuery] = useAtom(searchQueryAtom)
  const [results, setResults] = useAtom(searchResultsAtom)
  const [pending, setPending] = useAtom(searchPendingAtom)
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
    const term = query.trim()

    if (!term) {
      setResults(null)
      setPending(false)

      return
    }

    setPending(true)

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      api
        .listBookmarks({ q: term, take: SEARCH_LIMIT }, controller.signal)
        .then((bookmarks) => {
          setResults(bookmarks)
          setPending(false)
        })
        .catch(() => {
          if (controller.signal.aborted) return

          setResults([])
          setPending(false)
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, setResults, setPending])

  const openBookmark = (url: string) => {
    pushRecent(query)
    setOpen(false)
    openUrl(url)
  }

  const term = query.trim()

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
          <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
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
                  <button
                    aria-label={`Remove ${recent} from recent searches`}
                    className="ml-auto rounded-sm p-0.5 text-muted-foreground opacity-0 group-data-[selected=true]/recent:opacity-100 hover:text-foreground focus-visible:opacity-100"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.stopPropagation()
                      removeRecent(recent)
                    }}
                  >
                    <XIcon className="size-3.5" />
                  </button>
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
