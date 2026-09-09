"use client"

import { RELEASES_URL } from "@loomark/core/updates"

import { Link } from "@/components/link"
import { LinkSettings } from "@/components/settings/link-settings"
import { SettingsCard, SettingsPage } from "@/components/settings/settings-page"
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
      <ThemePicker />
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
