"use client"

import { useSetAtom } from "jotai"
import { PinIcon, PlusIcon } from "lucide-react"

import { BookmarkMenu } from "@/components/bookmark-menu"
import { EmptyState } from "@/components/empty-state"
import { FaviconImage } from "@/components/favicon-image"
import { PageHeader } from "@/components/page-header"
import { SortOrderSelect } from "@/components/sort-order-select"
import { Button } from "@/components/ui/button"
import { ShaderFire } from "@/components/ui/shader-fire"
import { useBookmarkList } from "@/hooks/use-bookmark-list"
import { hostFromUrl } from "@/lib/format"
import type { BookmarkDTO } from "@/lib/types"
import { bookmarkDialogAtom } from "@/store/atoms"

const PinnedItem = ({ bookmark }: { bookmark: BookmarkDTO }) => {
  const label = bookmark.title?.trim() || hostFromUrl(bookmark.url)

  return (
    <div className="group/pin flex w-[88px] flex-col items-center gap-2 sm:w-[96px]">
      <div className="relative">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex size-14 items-center justify-center rounded-xl bg-[#E9EAF2] transition-colors group-focus-within/pin:bg-[#E2E3EB] group-hover/pin:bg-[#E2E3EB] sm:size-16 dark:bg-muted dark:group-focus-within/pin:bg-muted/80 dark:group-hover/pin:bg-muted/80"
        >
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-white shadow-sm sm:size-10 dark:bg-card">
            <FaviconImage
              src={bookmark.faviconUrl}
              className="size-6 rounded-sm sm:size-7"
            />
          </span>
        </a>
        <BookmarkMenu
          bookmark={bookmark}
          className="absolute -top-1.5 -right-1.5 size-6 rounded-full border bg-white shadow-sm sm:size-6 md:opacity-0 md:group-focus-within/pin:opacity-100 md:group-hover/pin:opacity-100 dark:bg-card"
        />
      </div>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full truncate text-center text-xs leading-tight text-muted-foreground transition-colors group-focus-within/pin:text-foreground group-hover/pin:text-foreground sm:text-[13px]"
        title={label}
      >
        {label}
      </a>
    </div>
  )
}

export const HomeView = ({ pinned }: { pinned: BookmarkDTO[] }) => {
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)

  const addBookmark = () =>
    openBookmarkDialog({ open: true, bookmark: null, collectionId: null })

  const items = useBookmarkList(pinned)

  return (
    <>
      <PageHeader title="Homepage">
        <SortOrderSelect />
      </PageHeader>
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6 lg:p-8">
          {items.length === 0 ? (
            <div className="my-auto">
              <EmptyState
                icon={PinIcon}
                title="Nothing pinned yet"
                description="Pin the sites you open every day and they will live right here."
                action={
                  <Button variant="outline" onClick={addBookmark}>
                    <PlusIcon />
                    Add your first bookmark
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="mx-auto my-auto flex w-full max-w-5xl flex-wrap justify-center gap-x-4 gap-y-6 py-4 sm:gap-x-6 sm:gap-y-8 sm:py-6 lg:gap-x-8">
              {items.map((bookmark) => (
                <PinnedItem key={bookmark.id} bookmark={bookmark} />
              ))}
            </div>
          )}
        </div>
        <ShaderFire className="inset-y-auto bottom-0 h-48 [mask-image:linear-gradient(to_top,black_0%,transparent_100%)] sm:h-72" />
      </div>
    </>
  )
}
