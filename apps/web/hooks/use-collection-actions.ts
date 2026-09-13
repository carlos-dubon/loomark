"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import {
  applyCollectionMove,
  changedCollections,
  collectDescendantIds,
  insertionIndex,
} from "@loomark/core/tree"
import type { CollectionDTO } from "@loomark/core/types"

import { api } from "@/lib/client/api"
import { collectionsQuery } from "@/lib/client/queries"
import type { CollectionMoveInput } from "@/lib/schemas"

type MoveVariables = {
  input: CollectionMoveInput
  previous: CollectionDTO[]
}

export const useMoveCollection = (fallback: string) => {
  const queryClient = useQueryClient()
  const { queryKey } = collectionsQuery

  return useMutation({
    mutationFn: ({ input }: MoveVariables) => api.moveCollection(input),
    onSuccess: (collections) => {
      queryClient.setQueryData(queryKey, collections)
    },
    onError: (cause, { previous }) => {
      queryClient.setQueryData(queryKey, previous)
      toast.error(errorMessage(cause, fallback))
    },
  })
}

export const useCollectionActions = () => {
  const queryClient = useQueryClient()
  const { mutateAsync } = useMoveCollection("Move failed")
  const { queryKey } = collectionsQuery

  const move = async (
    id: string,
    parentId: string | null,
    beforeId: string | null = null
  ) => {
    const collections = queryClient.getQueryData(queryKey) ?? []
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

    await queryClient.cancelQueries({ queryKey })
    queryClient.setQueryData(queryKey, next)

    try {
      await mutateAsync({
        input: { id, parentId, index },
        previous: collections,
      })

      return true
    } catch {
      return false
    }
  }

  return { move }
}
