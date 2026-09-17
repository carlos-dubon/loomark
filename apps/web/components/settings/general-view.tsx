"use client"

import { RELEASES_URL } from "@loomark/core/updates"

import { LinkSettings } from "@/components/settings/link-settings"
import { SettingsCard, SettingsPage } from "@/components/settings/settings-page"
import { ThemeModePicker } from "@/components/settings/theme-mode-picker"
import { ThemePicker } from "@/components/settings/theme-picker"
import {
  ReleaseNotesButton,
  UpdateSettings,
  VersionRow,
} from "@/components/settings/update-settings"

export const GeneralView = ({
  version,
  isOwner,
}: {
  version: string
  isOwner: boolean
}) => (
  <SettingsPage title="General">
    <SettingsCard title="Theme" description="Press D to switch light and dark.">
      <div className="flex flex-col gap-4">
        <ThemeModePicker />
        <ThemePicker />
      </div>
    </SettingsCard>
    <SettingsCard title="Links">
      <LinkSettings />
    </SettingsCard>
    <SettingsCard title="About">
      {isOwner ? (
        <UpdateSettings version={version} />
      ) : (
        <VersionRow version={version}>
          <ReleaseNotesButton href={RELEASES_URL} />
        </VersionRow>
      )}
    </SettingsCard>
  </SettingsPage>
)
