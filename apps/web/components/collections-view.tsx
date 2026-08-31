"use client"

import { useSetAtom } from "jotai"
import { FolderTreeIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

import type { FlatCollection } from "@loomark/core/tree"
import { Button } from "@loomark/ui/components/button"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { useCollectionItems } from "@/hooks/use-collection-items"
import { collectionDialogAtom } from "@/store/atoms"

const CollectionCard = ({
  collection,
  parentName,
}: {
  collection: FlatCollection
  parentName?: string
}) => (
  <Link
    href={`/collections/${collection.id}`}
    className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/50"
  >
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-background">
      <CollectionIcon name={collection.icon} className="size-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">
        {collection.name}
      </span>
      <span className="block truncate text-xs text-muted-foreground">
        {collection.totalCount}{" "}
        {collection.totalCount === 1 ? "bookmark" : "bookmarks"}
        {parentName ? ` · in ${parentName}` : ""}
      </span>
    </span>
  </Link>
)

export const CollectionsView = () => {
  const { items } = useCollectionItems()
  const openCollectionDialog = useSetAtom(collectionDialogAtom)

  const addCollection = () =>
    openCollectionDialog({ open: true, collection: null, parentId: null })

  const names = new Map(items.map((item) => [item.id, item.name]))

  return (
    <>
      <PageHeader
        title="Collections"
        description={`${items.length} ${items.length === 1 ? "collection" : "collections"}`}
      >
        <Button variant="outline" onClick={addCollection}>
          <PlusIcon />
          New collection
        </Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 scroll-fade-b flex-col gap-6 overflow-y-auto p-4 md:p-6">
        {items.length === 0 ? (
          <EmptyState
            icon={FolderTreeIcon}
            title="No collections yet"
            description="Group your bookmarks into collections and they will all show up here."
            action={
              <Button variant="outline" onClick={addCollection}>
                <PlusIcon />
                Create your first collection
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <CollectionCard
                key={item.id}
                collection={item}
                parentName={
                  item.parentId ? names.get(item.parentId) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
