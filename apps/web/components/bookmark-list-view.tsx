"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { BookmarkIcon, InboxIcon, PlusIcon } from "lucide-react"
import { useMemo } from "react"

import { siblingsOf } from "@loomark/core/tree"
import type { BookmarkDTO, CollectionDTO } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"

import { BookmarkGrid } from "@/components/bookmark-grid"
import { CollectionMenu } from "@/components/collection-menu"
import { CollectionGrid } from "@/components/collection-grid"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { SortOrderSelect } from "@/components/sort-order-select"
import { ViewModeToggle } from "@/components/view-mode-toggle"
import { useBookmarkList } from "@/hooks/use-bookmark-list"
import {
  bookmarkDialogAtom,
  collectionsAtom,
  viewModeAtom,
} from "@/store/atoms"

const EMPTY_ICONS = {
  bookmark: BookmarkIcon,
  inbox: InboxIcon,
}

export const BookmarkListView = ({
  title,
  emptyIcon = "bookmark",
  emptyTitle,
  emptyDescription,
  collectionId,
  collection,
  bookmarks,
}: {
  title: React.ReactNode
  emptyIcon?: keyof typeof EMPTY_ICONS
  emptyTitle: string
  emptyDescription: string
  collectionId: string | null
  collection?: CollectionDTO
  bookmarks: BookmarkDTO[]
}) => {
  const mode = useAtomValue(viewModeAtom)
  const collections = useAtomValue(collectionsAtom)
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)
  const { items, manual } = useBookmarkList(
    bookmarks,
    "collection",
    collectionId
  )

  const addBookmark = () =>
    openBookmarkDialog({ open: true, bookmark: null, collectionId })

  const children = useMemo(
    () => (collectionId ? siblingsOf(collections, collectionId) : []),
    [collections, collectionId]
  )

  const hasCollections = children.length > 0
  const hasBookmarks = items.length > 0

  return (
    <>
      <PageHeader
        title={
          collection && collection.kind === "USER" ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <CollectionIcon
                name={collection.icon}
                className="size-3.5 shrink-0"
              />
              <span className="truncate">{title}</span>
            </span>
          ) : (
            title
          )
        }
        description={`${items.length} ${items.length === 1 ? "bookmark" : "bookmarks"}`}
      >
        <ViewModeToggle />
        <SortOrderSelect />
        {collection && collection.kind === "USER" ? (
          <CollectionMenu collection={collection} />
        ) : null}
      </PageHeader>
      <div className="@container flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6">
        {hasCollections ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Collections</h2>
            <CollectionGrid collections={children} parentId={collectionId} />
          </section>
        ) : null}
        {hasBookmarks ? (
          <>
            {hasCollections ? (
              <h2 className="text-sm font-semibold">Bookmarks</h2>
            ) : null}
            <BookmarkGrid bookmarks={items} mode={mode} manual={manual} />
          </>
        ) : hasCollections ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Bookmarks</h2>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <BookmarkIcon className="mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                No bookmarks in this collection
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Add a bookmark to get started.
              </p>
              <Button variant="outline" onClick={addBookmark}>
                <PlusIcon />
                Add bookmark
              </Button>
            </div>
          </section>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={EMPTY_ICONS[emptyIcon]}
              title={emptyTitle}
              description={emptyDescription}
              action={
                <Button variant="outline" onClick={addBookmark}>
                  <PlusIcon />
                  Add bookmark
                </Button>
              }
            />
          </div>
        )}
      </div>
    </>
  )
}
