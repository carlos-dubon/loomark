"use client"

import {
  ProfileSettings,
  type Profile,
} from "@/components/settings/profile-settings"
import { SettingsCard, SettingsPage } from "@/components/settings/settings-page"

export const ProfileView = ({ profile }: { profile: Profile }) => (
  <SettingsPage title="Your profile">
    <SettingsCard title="Profile picture">
      <ProfileSettings profile={profile} />
    </SettingsCard>
  </SettingsPage>
)
