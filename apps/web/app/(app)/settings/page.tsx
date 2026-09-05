import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { GeneralView } from "@/components/settings/general-view"
import { auth } from "@/lib/auth"
import { isDemo } from "@/lib/demo/config"

export const metadata: Metadata = { title: "General" }

const SettingsPage = async () => {
  if (isDemo) {
    return <GeneralView version="demo" />
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return <GeneralView version={process.env.APP_VERSION ?? "dev"} />
}

export default SettingsPage
