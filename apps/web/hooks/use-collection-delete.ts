"use client"

import { useSetAtom } from "jotai"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import type { CollectionDeletion, CollectionDTO } from "@loomark/core/types"

import { api } from "@/lib/client-api"
import {
  collectionsAtom,
  removeBookmarksAtom,
  removeCollectionAtom,
  restoreBookmarksAtom,
} from "@/store/atoms"

export const useCollectionDelete = () => {
  const router = useRouter()
  const pathname = usePathname()
  const setCollections = useSetAtom(collectionsAtom)
  const removeCollection = useSetAtom(removeCollectionAtom)
  const removeBookmarks = useSetAtom(removeBookmarksAtom)
  const restoreBookmarks = useSetAtom(restoreBookmarksAtom)

  const [pending, setPending] = useState(false)

  const undo = async (deletion: CollectionDeletion, name: string) => {
    try {
      setCollections(await api.restoreCollection(deletion))
      restoreBookmarks(deletion.bookmarks)
      toast.success(`“${name}” restored`)
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Restore failed")
    }
  }

  const destroy = async (collection: CollectionDTO) => {
    setPending(true)

    try {
      const deletion = await api.deleteCollection(collection.id)

      removeCollection(collection.id)
      removeBookmarks(deletion.bookmarks.map((bookmark) => bookmark.id))

      if (
        deletion.collections.some((removed) =>
          pathname.startsWith(`/collections/${removed.id}`)
        )
      ) {
        router.push("/")
      }

      router.refresh()

      toast.success(`Deleted “${collection.name}”`, {
        action: {
          label: "Undo",
          onClick: () => void undo(deletion, collection.name),
        },
      })
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Delete failed")
    } finally {
      setPending(false)
    }
  }

  return { destroy, pending }
}
