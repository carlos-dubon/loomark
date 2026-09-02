import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { getArchiveSettings, toArchiveColumns } from "@/lib/archives/queue"
import { prisma } from "@/lib/prisma"
import { archiveSettingsSchema } from "@/lib/schemas"

export const GET = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const settings = await getArchiveSettings(userId)

  if (!settings) {
    return jsonError("User not found", 404)
  }

  return Response.json(settings)
}

export const PATCH = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, archiveSettingsSchema)

  if (!data) {
    return response
  }

  await prisma.user.update({
    where: { id: userId },
    data: toArchiveColumns(data),
  })

  return Response.json(await getArchiveSettings(userId))
}
