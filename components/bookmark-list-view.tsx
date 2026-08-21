"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { BookmarkIcon, FolderIcon, InboxIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

import { BookmarkGrid } from "@/components/bookmark-grid"
import { CollectionMenu } from "@/components/collection-menu"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { SortOrderSelect } from "@/components/sort-order-select"
import { Button } from "@/components/ui/button"
import { ViewModeToggle } from "@/components/view-mode-toggle"
import { useBookmarkList } from "@/hooks/use-bookmark-list"
import type { BookmarkDTO, CollectionDTO } from "@/lib/types"
import { bookmarkDialogAtom, viewModeAtom } from "@/store/atoms"

const EMPTY_ICONS = {
  bookmark: BookmarkIcon,
  inbox: InboxIcon,
}

const CollectionCard = ({ collection }: { collection: CollectionDTO }) => (
  <Link
    href={`/collections/${collection.id}`}
    className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/50"
  >
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-background">
      <FolderIcon className="size-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">
        {collection.name}
      </span>
      <span className="block truncate text-xs text-muted-foreground">
        {collection.bookmarkCount}{" "}
        {collection.bookmarkCount === 1 ? "bookmark" : "bookmarks"}
      </span>
    </span>
  </Link>
)

export const BookmarkListView = ({
  title,
  emptyIcon = "bookmark",
  emptyTitle,
  emptyDescription,
  collectionId,
  collection,
  bookmarks,
  subcollections = [],
}: {
  title: React.ReactNode
  emptyIcon?: keyof typeof EMPTY_ICONS
  emptyTitle: string
  emptyDescription: string
  collectionId: string | null
  collection?: CollectionDTO
  bookmarks: BookmarkDTO[]
  subcollections?: CollectionDTO[]
}) => {
  const mode = useAtomValue(viewModeAtom)
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)
  const items = useBookmarkList(bookmarks)

  const addBookmark = () =>
    openBookmarkDialog({ open: true, bookmark: null, collectionId })

  const hasCollections = subcollections.length > 0
  const hasBookmarks = items.length > 0

  return (
    <>
      <PageHeader
        title={title}
        description={`${items.length} ${items.length === 1 ? "bookmark" : "bookmarks"}`}
      >
        <ViewModeToggle />
        <SortOrderSelect />
        {collection && collection.kind === "USER" ? (
          <CollectionMenu collection={collection} />
        ) : null}
      </PageHeader>
      <div className="flex min-h-0 flex-1 scroll-fade-b flex-col gap-6 overflow-y-auto p-4 md:p-6">
        {hasCollections ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Collections</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {subcollections.map((child) => (
                <CollectionCard key={child.id} collection={child} />
              ))}
            </div>
          </section>
        ) : null}
        {hasBookmarks ? (
          <>
            {hasCollections ? (
              <h2 className="text-sm font-semibold">Bookmarks</h2>
            ) : null}
            <BookmarkGrid bookmarks={items} mode={mode} />
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
        )}
      </div>
    </>
  )
}
