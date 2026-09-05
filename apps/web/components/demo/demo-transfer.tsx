"use client"

import { TransferView } from "@/components/settings/transfer-view"
import { useDemoState } from "@/hooks/use-demo-state"

export const DemoTransfer = () => {
  const state = useDemoState()

  return (
    <TransferView
      bookmarkCount={state.bookmarks.length}
      collectionCount={state.collections.length}
    />
  )
}
