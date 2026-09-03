"use client"

import { useAtom } from "jotai"
import { useState } from "react"
import { toast } from "sonner"

import type { ArchiveFormat } from "@loomark/core/archive"

import { api } from "@/lib/client-api"
import { archiveSettingsAtom, archiveUsageAtom } from "@/store/atoms"

export const useArchiveSettings = () => {
  const [settings, setSettings] = useAtom(archiveSettingsAtom)
  const [backfilling, setBackfilling] = useState(false)

  const toggle = async (format: ArchiveFormat, enabled: boolean) => {
    const previous = settings

    setSettings({ ...settings, [format]: enabled })

    try {
      setSettings(await api.updateArchiveSettings({ [format]: enabled }))
    } catch (cause) {
      setSettings(previous)
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Could not save archive setting"
      )
    }
  }

  const backfill = async () => {
    setBackfilling(true)

    try {
      const { queued } = await api.backfillArchives()

      toast.success(
        queued === 0
          ? "Everything is already queued or archived"
          : `${queued} ${queued === 1 ? "archive" : "archives"} queued`
      )
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not queue")
    } finally {
      setBackfilling(false)
    }
  }

  return { settings, toggle, backfill, backfilling }
}

export const useArchiveUsage = () => {
  const [usage, setUsage] = useAtom(archiveUsageAtom)
  const [clearing, setClearing] = useState(false)

  const clear = async () => {
    setClearing(true)

    try {
      const { cleared, ...next } = await api.clearArchives()

      setUsage(next)
      toast.success(
        cleared === 0
          ? "There was nothing archived to clear"
          : `${cleared} ${cleared === 1 ? "archive" : "archives"} cleared`
      )
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not clear")
    } finally {
      setClearing(false)
    }
  }

  return { usage, clear, clearing }
}
