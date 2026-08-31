"use client"

import { useSetAtom } from "jotai"
import { useEffect, useState } from "react"

import type { BookmarkDTO } from "@loomark/core/types"

import { api } from "@/lib/client-api"
import { upsertBookmarkAtom } from "@/store/atoms"

const MAX_CONCURRENT = 2

const attempted = new Set<string>()
const queue: (() => Promise<void>)[] = []

let active = 0

const drain = () => {
  while (active < MAX_CONCURRENT) {
    const task = queue.shift()

    if (!task) {
      return
    }

    active += 1

    void task().finally(() => {
      active -= 1
      drain()
    })
  }
}

export const useBookmarkPreview = (bookmark: BookmarkDTO, enabled: boolean) => {
  const upsertBookmark = useSetAtom(upsertBookmarkAtom)
  const [settled, setSettled] = useState(() => attempted.has(bookmark.id))

  useEffect(() => {
    const wanted = (enabled && !bookmark.previewUrl) || !bookmark.faviconUrl

    if (!wanted || attempted.has(bookmark.id)) {
      return
    }

    attempted.add(bookmark.id)

    let cancelled = false

    queue.push(async () => {
      try {
        const updated = await api.refreshPreview(bookmark.id)

        if (
          updated.previewUrl !== bookmark.previewUrl ||
          updated.faviconUrl !== bookmark.faviconUrl
        ) {
          upsertBookmark(updated)
        }
      } catch {
        attempted.delete(bookmark.id)
      } finally {
        if (!cancelled) {
          setSettled(true)
        }
      }
    })

    drain()

    return () => {
      cancelled = true
    }
  }, [
    bookmark.id,
    bookmark.previewUrl,
    bookmark.faviconUrl,
    enabled,
    upsertBookmark,
  ])

  return enabled && !bookmark.previewUrl && !settled
}
