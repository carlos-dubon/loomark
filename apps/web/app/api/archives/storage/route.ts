import type { ArchiveUsage } from "@loomark/core/archive"

import { jsonError, requireUserId } from "@/lib/api"
import { archiveBytesFor, removeUserArchives } from "@/lib/archives/storage"
import { prisma } from "@/lib/prisma"

const usage = async (userId: string): Promise<ArchiveUsage> => {
  const [bytes, archives] = await Promise.all([
    archiveBytesFor(userId),
    prisma.archive.count({ where: { userId } }),
  ])

  return { bytes, archives }
}

export const GET = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  return Response.json(await usage(userId))
}

export const DELETE = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { count } = await prisma.archive.deleteMany({ where: { userId } })

  await removeUserArchives(userId)

  return Response.json({ ...(await usage(userId)), cleared: count })
}
