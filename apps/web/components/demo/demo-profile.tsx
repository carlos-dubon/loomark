"use client"

import { ProfileView } from "@/components/settings/profile-view"
import { useDemoState } from "@/hooks/use-demo-state"

export const DemoProfile = () => {
  const state = useDemoState()

  return <ProfileView profile={state.user} />
}
