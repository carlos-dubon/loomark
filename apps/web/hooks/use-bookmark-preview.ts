"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import type { BookmarkDTO } from "@loomark/core/types"

import { api } from "@/lib/client/api"
import { upsertBookmarkInCache } from "@/lib/client/queries"
import { queryKeys } from "@/lib/query-keys"

const MAX_CONCURRENT = 2

const queue: (() => void)[] = []

let active = 0

const drain = () => {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    queue.shift()?.()
  }
}

const limit = <T>(task: () => Promise<T>) =>
  new Promise<T>((resolve, reject) => {
    queue.push(() => {
      active += 1

      void task()
        .then(resolve, reject)
        .finally(() => {
          active -= 1
          drain()
        })
    })

    drain()
  })

export const useBookmarkPreview = (bookmark: BookmarkDTO, enabled: boolean) => {
  const queryClient = useQueryClient()
  const wanted = (enabled && !bookmark.previewUrl) || !bookmark.faviconUrl

  const { isPending } = useQuery({
    queryKey: queryKeys.bookmarkPreview(bookmark.id),
    queryFn: async () => {
      const updated = await limit(() => api.refreshPreview(bookmark.id))

      if (
        updated.previewUrl !== bookmark.previewUrl ||
        updated.faviconUrl !== bookmark.faviconUrl
      ) {
        upsertBookmarkInCache(queryClient, updated)
      }

      return updated
    },
    enabled: wanted,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

  return enabled && !bookmark.previewUrl && isPending
}
