"use client"

import { useAtom } from "jotai"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  applyCollectionMove,
  changedCollections,
  collectDescendantIds,
  insertionIndex,
} from "@loomark/core/tree"

import { api } from "@/lib/client-api"
import { collectionsAtom } from "@/store/atoms"

export const useCollectionActions = () => {
  const router = useRouter()
  const [collections, setCollections] = useAtom(collectionsAtom)

  const move = async (
    id: string,
    parentId: string | null,
    beforeId: string | null = null
  ) => {
    const moving = collections.find((collection) => collection.id === id)

    if (!moving) {
      return false
    }

    if (moving.kind === "UNSORTED") {
      toast.error("Unsorted cannot be moved")
      return false
    }

    if (parentId === id) {
      return false
    }

    if (parentId && collectDescendantIds(collections, id).includes(parentId)) {
      toast.error("A collection cannot be moved into itself")
      return false
    }

    const index = insertionIndex(collections, parentId, beforeId, id)
    const next = applyCollectionMove(collections, id, parentId, index)

    if (changedCollections(collections, next).length === 0) {
      return false
    }

    const previous = collections
    setCollections(next)

    try {
      setCollections(await api.moveCollection({ id, parentId, index }))
      router.refresh()

      return true
    } catch (cause) {
      setCollections(previous)
      toast.error(cause instanceof Error ? cause.message : "Move failed")

      return false
    }
  }

  return { move }
}
