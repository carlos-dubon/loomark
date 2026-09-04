import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { getAppearance } from "@/lib/appearance"
import { prisma } from "@/lib/prisma"
import { appearanceUpdateSchema } from "@/lib/schemas"

export const GET = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  return Response.json(await getAppearance(userId))
}

export const PATCH = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, appearanceUpdateSchema)

  if (!data) {
    return response
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      themeId: data.themeId,
      viewMode: data.viewMode,
      sortOrder: data.sortOrder,
    },
  })

  return Response.json(await getAppearance(userId))
}
