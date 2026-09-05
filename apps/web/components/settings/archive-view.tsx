"use client"

import { useHydrateAtoms } from "jotai/utils"

import type {
  ArchiveSettings as ArchiveSettingsValue,
  ArchiveUsage,
} from "@loomark/core/archive"
import type { ArchiveQueue as ArchiveQueueValue } from "@loomark/core/types"

import { ArchiveClearDialog } from "@/components/settings/archive-clear-dialog"
import { ArchiveQueue } from "@/components/settings/archive-queue"
import { ArchiveSettings } from "@/components/settings/archive-settings"
import { SettingsCard, SettingsPage } from "@/components/settings/settings-page"
import {
  archiveQueueAtom,
  archiveSettingsAtom,
  archiveUsageAtom,
} from "@/store/atoms"

export const ArchiveView = ({
  archiveQueue,
  archiveSettings,
  archiveUsage,
}: {
  archiveQueue: ArchiveQueueValue
  archiveSettings: ArchiveSettingsValue
  archiveUsage: ArchiveUsage
}) => {
  useHydrateAtoms([
    [archiveQueueAtom, archiveQueue],
    [archiveSettingsAtom, archiveSettings],
    [archiveUsageAtom, archiveUsage],
  ])

  return (
    <>
      <SettingsPage
        title="Archive"
        description="Saved copies and what is being captured"
      >
        <SettingsCard
          title="Formats"
          description="Keep your own copy of every page you save, so the bookmark still means something once the site goes down or quietly rewrites the article. Formats you turn on here are captured for every new bookmark; existing ones are left alone until you ask for them. Archives live on the server disk, so watch the space and clear them when they outgrow it."
        >
          <ArchiveSettings />
        </SettingsCard>
        <ArchiveQueue />
      </SettingsPage>
      <ArchiveClearDialog />
    </>
  )
}
