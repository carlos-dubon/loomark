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
  <SettingsPage title="General" description="Appearance and link behaviour">
    <SettingsCard
      title="Theme"
      description="Six palettes, each tuned for light and dark, so the mode toggle keeps working whichever one you pick. Press D to switch modes."
    >
      <ThemePicker />
    </SettingsCard>
    <SettingsCard
      title="Links"
      description="Bookmarks and other outside links open in a new tab by default. If Loomark is your new tab page, turn this off so they load in the tab you are already in and the back button brings you home. Kept in a cookie on this browser, not on your account."
    >
      <LinkSettings />
    </SettingsCard>
    <SettingsCard
      title="About"
      description={
        <>
          Running Loomark{" "}
          <span className="font-mono text-foreground">{version}</span>. Check{" "}
          <Link
            className="underline underline-offset-4 hover:text-foreground"
            href={RELEASES_URL}
          >
            the releases page
          </Link>{" "}
          for what is new.
        </>
      }
    >
      {isOwner ? <UpdateSettings /> : null}
    </SettingsCard>
  </SettingsPage>
)
