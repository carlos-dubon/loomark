import { jsonError, requireUserId } from "@/lib/api"
import { archiveQueueFor, cancelArchives } from "@/lib/archives/queue"

export const GET = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  return Response.json(await archiveQueueFor(userId))
}

export const DELETE = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const canceled = await cancelArchives(userId)

  return Response.json({ ...(await archiveQueueFor(userId)), canceled })
}
