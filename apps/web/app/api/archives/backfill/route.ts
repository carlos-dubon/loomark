import { jsonError, requireUserId } from "@/lib/api"
import { enabledFormatsFor, enqueueArchives } from "@/lib/archives/queue"
import { prisma } from "@/lib/prisma"

const BATCH = 500

export const POST = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const formats = await enabledFormatsFor(userId)

  if (formats.length === 0) {
    return jsonError("Turn on at least one archive format first", 400)
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  })

  let queued = 0

  for (let index = 0; index < bookmarks.length; index += BATCH) {
    queued += await enqueueArchives(
      userId,
      bookmarks.slice(index, index + BATCH).map((bookmark) => bookmark.id),
      formats
    )
  }

  return Response.json({ queued })
}
