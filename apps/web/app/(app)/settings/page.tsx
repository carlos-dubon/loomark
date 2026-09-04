import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DEFAULT_ARCHIVE_SETTINGS } from "@loomark/core/archive"

import { SettingsView } from "@/components/settings-view"
import { getArchiveSettings } from "@/lib/archives/queue"
import { archiveBytesFor } from "@/lib/archives/storage"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfile } from "@/lib/queries"

export const metadata: Metadata = { title: "Settings" }

const SettingsPage = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [
    bookmarkCount,
    collectionCount,
    archiveSettings,
    bytes,
    archives,
    profile,
  ] = await Promise.all([
    prisma.bookmark.count({ where: { userId: session.user.id } }),
    prisma.collection.count({ where: { userId: session.user.id } }),
    getArchiveSettings(session.user.id),
    archiveBytesFor(session.user.id),
    prisma.archive.count({ where: { userId: session.user.id } }),
    getProfile(session.user.id),
  ])

  if (!profile) {
    redirect("/login")
  }

  return (
    <SettingsView
      archiveSettings={archiveSettings ?? DEFAULT_ARCHIVE_SETTINGS}
      archiveUsage={{ bytes, archives }}
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
