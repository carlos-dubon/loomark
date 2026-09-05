"use client"

import {
  ProfileSettings,
  type Profile,
} from "@/components/settings/profile-settings"
import { SettingsCard, SettingsPage } from "@/components/settings/settings-page"

export const ProfileView = ({ profile }: { profile: Profile }) => (
  <SettingsPage title="Your profile" description="Name and picture">
    <SettingsCard
      title="Profile picture"
      description="Shown next to your name in the sidebar and, if this instance has more than one account, on the server administration page. Pictures are cropped to a square and scaled down before they are saved."
    >
      <ProfileSettings profile={profile} />
    </SettingsCard>
  </SettingsPage>
)
