"use client"

import { useSortable } from "@dnd-kit/react/sortable"
import { useSetAtom } from "jotai"
import { PinIcon, PlusIcon, UploadIcon } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

import type { BookmarkDTO } from "@loomark/core/types"
import { hostFromUrl } from "@loomark/core/url"
import { cn } from "@loomark/core/utils"
import { Button } from "@loomark/ui/components/button"

import { BookmarkMenu } from "@/components/bookmark-menu"
import { EmptyState } from "@/components/empty-state"
import { FaviconImage } from "@/components/favicon-image"
import { PageHeader } from "@/components/page-header"
import { SortOrderSelect } from "@/components/sort-order-select"
import { useBookmarkList } from "@/hooks/use-bookmark-list"
import { useBookmarkPreview } from "@/hooks/use-bookmark-preview"
import { useCoarsePointer } from "@/hooks/use-coarse-pointer"
import { DRAG_TYPE } from "@/lib/dnd"
import { bookmarkDialogAtom } from "@/store/atoms"

const PinnedItem = ({
  bookmark,
  index,
  manual,
}: {
  bookmark: BookmarkDTO
  index: number
  manual: boolean
}) => {
  const label = bookmark.title?.trim() || hostFromUrl(bookmark.url)
  const data = useMemo(() => ({ bookmark }), [bookmark])
  const coarsePointer = useCoarsePointer()

  const { ref, isDragSource } = useSortable({
    id: bookmark.id,
    index,
    type: DRAG_TYPE.bookmark,
    accept: DRAG_TYPE.bookmark,
    data,
    disabled: !manual || coarsePointer,
  })

  useBookmarkPreview(bookmark, false)

  return (
    <div
      ref={ref}
      className={cn(
        "group/pin relative flex w-[88px] flex-col items-center gap-2 sm:w-[96px]",
        manual && "pointer-fine:touch-none",
        isDragSource && "opacity-40"
      )}
    >
      <div className="relative">
        <div className="flex size-14 items-center justify-center rounded-xl bg-muted ring-1 ring-transparent transition group-focus-within/pin:bg-accent group-focus-within/pin:ring-foreground/20 group-hover/pin:bg-accent group-hover/pin:ring-foreground/20 sm:size-16">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-card shadow-sm sm:size-10">
            <FaviconImage
              src={bookmark.faviconUrl}
              className="size-6 rounded-sm sm:size-7"
            />
          </span>
        </div>
        <BookmarkMenu
          bookmark={bookmark}
          className="absolute -top-1.5 -right-1.5 z-20 size-6 rounded-full border bg-card shadow-sm sm:size-6 md:opacity-0 md:group-focus-within/pin:opacity-100 md:group-hover/pin:opacity-100"
        />
      </div>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full rounded-sm text-center text-xs leading-tight text-muted-foreground transition-colors outline-none group-focus-within/pin:text-foreground group-hover/pin:text-foreground after:absolute after:inset-0 after:rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-[13px]"
        title={label}
      >
        <span className="block truncate">{label}</span>
      </a>
    </div>
  )
}

export const HomeView = ({
  pinned,
  bookmarkCount,
}: {
  pinned: BookmarkDTO[]
  bookmarkCount?: number
}) => {
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)

  const addBookmark = () =>
    openBookmarkDialog({ open: true, bookmark: null, collectionId: null })

  const { items, manual } = useBookmarkList(pinned, "pinned")

  const isEmptyLibrary = bookmarkCount === 0 && pinned.length === 0

  return (
    <>
      <PageHeader title="Homepage">
        <SortOrderSelect />
      </PageHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6 lg:p-8">
        {items.length === 0 ? (
          <div className="my-auto">
            {isEmptyLibrary ? (
              <EmptyState
                icon={UploadIcon}
                title="No bookmarks yet"
                description="Import your bookmarks from your browser to get started."
                action={
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/settings" />}
                  >
                    <UploadIcon />
                    Import bookmarks
                  </Button>
                }
              />
            ) : (
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
            )}
          </div>
        ) : (
          <div className="mx-auto my-auto flex w-full max-w-5xl flex-wrap justify-center gap-x-4 gap-y-6 py-4 sm:gap-x-6 sm:gap-y-8 sm:py-6 lg:gap-x-8">
            {items.map((bookmark, index) => (
              <PinnedItem
                key={bookmark.id}
                bookmark={bookmark}
                index={index}
                manual={manual}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
