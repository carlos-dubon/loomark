"use client"

import { RELEASES_URL } from "@loomark/core/updates"

import { Link } from "@/components/link"
import { LinkSettings } from "@/components/settings/link-settings"
import { SettingsCard, SettingsPage } from "@/components/settings/settings-page"
import { ThemeModePicker } from "@/components/settings/theme-mode-picker"
import { ThemePicker } from "@/components/settings/theme-picker"
import { UpdateSettings } from "@/components/settings/update-settings"

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
    <SettingsCard
      title="About"
      description={
        <>
          Loomark <span className="font-mono text-foreground">{version}</span> ·{" "}
          <Link
            className="underline underline-offset-4 hover:text-foreground"
            href={RELEASES_URL}
          >
            Release notes
          </Link>
        </>
      }
    >
      {isOwner ? <UpdateSettings /> : null}
    </SettingsCard>
  </SettingsPage>
)
