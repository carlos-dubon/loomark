import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { SettingsView } from "@/components/settings-view"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfile } from "@/lib/queries"

export const metadata: Metadata = { title: "Settings" }

const SettingsPage = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [bookmarkCount, collectionCount, profile] = await Promise.all([
    prisma.bookmark.count({ where: { userId: session.user.id } }),
    prisma.collection.count({ where: { userId: session.user.id } }),
    getProfile(session.user.id),
  ])

  if (!profile) {
    redirect("/login")
  }

  return (
    <SettingsView
      bookmarkCount={bookmarkCount}
      collectionCount={collectionCount}
      profile={{
        name: profile.name,
        email: profile.email,
        image: profile.image,
      }}
      version={process.env.APP_VERSION ?? "dev"}
    />
  )
}

export default SettingsPage
