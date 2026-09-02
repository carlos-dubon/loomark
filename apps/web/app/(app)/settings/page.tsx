import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DEFAULT_ARCHIVE_SETTINGS } from "@loomark/core/archive"

import { SettingsView } from "@/components/settings-view"
import { getArchiveSettings } from "@/lib/archives/queue"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Settings" }

const SettingsPage = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [bookmarkCount, collectionCount, archiveSettings] = await Promise.all([
    prisma.bookmark.count({ where: { userId: session.user.id } }),
    prisma.collection.count({ where: { userId: session.user.id } }),
    getArchiveSettings(session.user.id),
  ])

  return (
    <SettingsView
      archiveSettings={archiveSettings ?? DEFAULT_ARCHIVE_SETTINGS}
      bookmarkCount={bookmarkCount}
      collectionCount={collectionCount}
      version={process.env.APP_VERSION ?? "dev"}
    />
  )
}

export default SettingsPage
