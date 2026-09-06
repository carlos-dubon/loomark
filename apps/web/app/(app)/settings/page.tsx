import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { GeneralView } from "@/components/settings/general-view"
import { auth } from "@/lib/auth"
import { isDemo } from "@/lib/demo/config"
import { getProfile } from "@/lib/queries"

export const metadata: Metadata = { title: "General" }

const SettingsPage = async () => {
  if (isDemo) {
    return <GeneralView version="demo" isOwner={false} />
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const profile = await getProfile(session.user.id)

  return (
    <GeneralView
      version={process.env.APP_VERSION ?? "dev"}
      isOwner={profile?.role === "OWNER"}
    />
  )
}

export default SettingsPage
