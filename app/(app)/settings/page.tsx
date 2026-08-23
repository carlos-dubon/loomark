import { redirect } from "next/navigation"

import { SettingsView } from "@/components/settings-view"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SettingsPage = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [bookmarkCount, collectionCount] = await Promise.all([
    prisma.bookmark.count({ where: { userId: session.user.id } }),
    prisma.collection.count({ where: { userId: session.user.id } }),
  ])

  return (
    <SettingsView
      bookmarkCount={bookmarkCount}
      collectionCount={collectionCount}
    />
  )
}

export default SettingsPage
