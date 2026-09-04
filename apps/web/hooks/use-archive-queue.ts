"use client"

import { useAtom } from "jotai"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { ArchiveFormat } from "@loomark/core/archive"

import { api } from "@/lib/client-api"
import { archiveQueueAtom } from "@/store/atoms"

const BUSY_MS = 2000
const IDLE_MS = 15000

export const useArchiveQueue = () => {
  const [queue, setQueue] = useAtom(archiveQueueAtom)
  const [canceling, setCanceling] = useState(false)
  const busy = queue.pending + queue.running > 0

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const poll = async () => {
      try {
        const next = await api.archiveQueue(controller.signal)

        if (!cancelled) {
          setQueue(next)
        }
      } catch {
        return
      }
    }

    const timer = setInterval(() => void poll(), busy ? BUSY_MS : IDLE_MS)

    void poll()

    return () => {
      cancelled = true
      controller.abort()
      clearInterval(timer)
    }
  }, [busy, setQueue])

  const refresh = async () => {
    try {
      setQueue(await api.archiveQueue())
    } catch {
      return
    }
  }

  const cancelBookmark = async (
    bookmarkId: string,
    formats?: ArchiveFormat[]
  ) => {
    try {
      await api.cancelArchives(bookmarkId, formats)
      await refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not cancel")
    }
  }

  const cancelAll = async () => {
    setCanceling(true)

    try {
      const { canceled, ...next } = await api.clearArchiveQueue()

      setQueue(next)
      toast.success(
        canceled === 0
          ? "The queue was already empty"
          : `${canceled} ${canceled === 1 ? "capture" : "captures"} canceled`
      )
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not cancel")
    } finally {
      setCanceling(false)
    }
  }

  return { queue, busy, canceling, cancelAll, cancelBookmark, refresh }
}
