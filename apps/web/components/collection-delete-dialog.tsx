"use client"

import { useAtom, useAtomValue } from "jotai"
import { useState } from "react"

import { plural } from "@loomark/core/format"
import { collectDescendantIds } from "@loomark/core/tree"
import type { CollectionDTO } from "@loomark/core/types"
import { ConfirmDialog } from "@loomark/ui/components/confirm-dialog"

import { useCollectionDelete } from "@/hooks/use-collection-delete"
import { collectionDeleteDialogAtom, collectionsAtom } from "@/store/atoms"

type Doomed = {
  id: string
  name: string
  nested: number
  bookmarks: number
}

const summarize = (
  collection: CollectionDTO,
  collections: CollectionDTO[]
): Doomed => {
  const doomed = new Set(collectDescendantIds(collections, collection.id))

  return {
    id: collection.id,
    name: collection.name,
    nested: doomed.size - 1,
    bookmarks: collections
      .filter((item) => doomed.has(item.id))
      .reduce((sum, item) => sum + item.bookmarkCount, 0),
  }
}

export const CollectionDeleteDialog = () => {
  const [collection, setCollection] = useAtom(collectionDeleteDialogAtom)
  const collections = useAtomValue(collectionsAtom)
  const { destroy, pending } = useCollectionDelete()

  const [doomed, setDoomed] = useState<Doomed | null>(null)

  if (collection && collection.id !== doomed?.id) {
    setDoomed(summarize(collection, collections))
  }

  return (
    <ConfirmDialog
      open={collection !== null}
      onOpenChange={(open) => {
        if (!open) {
          setCollection(null)
        }
      }}
      pending={pending}
      title={`Delete “${doomed?.name}”?`}
      description={
        <>
          {doomed && doomed.nested > 0 ? (
            <>
              This also deletes {plural(doomed.nested, "nested collection")}
              .{" "}
            </>
          ) : null}
          {doomed && doomed.bookmarks > 0 ? (
            <>{plural(doomed.bookmarks, "bookmark")} will be deleted too. </>
          ) : null}
        </>
      }
      confirmLabel="Delete collection"
      onConfirm={async () => {
        if (!collection) {
          return
        }

        await destroy(collection)
        setCollection(null)
      }}
    />
  )
}
