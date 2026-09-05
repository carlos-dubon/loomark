"use client"

import { ArchiveView } from "@/components/settings/archive-view"
import { useDemoState } from "@/hooks/use-demo-state"
import { archiveUsage } from "@/lib/demo/store"
import { EMPTY_ARCHIVE_QUEUE } from "@loomark/core/types"

export const DemoArchiveSettings = () => {
  const state = useDemoState()

  return (
    <ArchiveView
      archiveQueue={EMPTY_ARCHIVE_QUEUE}
      archiveSettings={state.archiveSettings}
      archiveUsage={archiveUsage(state)}
    />
  )
}
