import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DEFAULT_ARCHIVE_SETTINGS } from "@loomark/core/archive"

import { ArchiveView } from "@/components/settings/archive-view"
import { archiveQueueFor, getArchiveSettings } from "@/lib/archives/queue"
import { archiveBytesFor } from "@/lib/archives/storage"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Archive" }

const ArchivePage = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [archiveSettings, archiveQueue, bytes, archives] = await Promise.all([
    getArchiveSettings(session.user.id),
    archiveQueueFor(session.user.id),
    archiveBytesFor(session.user.id),
    prisma.archive.count({ where: { userId: session.user.id } }),
  ])

  return (
    <ArchiveView
      archiveQueue={archiveQueue}
      archiveSettings={archiveSettings ?? DEFAULT_ARCHIVE_SETTINGS}
      archiveUsage={{ bytes, archives }}
    />
  )
}

export default ArchivePage
