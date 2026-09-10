import { parseBody, withUser } from "@/lib/server/api"
import { getAppearance } from "@/lib/server/appearance"
import { prisma } from "@/lib/server/prisma"
import { appearanceUpdateSchema } from "@/lib/schemas"

export const GET = withUser(async (_request, userId) =>
  Response.json(await getAppearance(userId))
)

export const PATCH = withUser(async (request, userId) => {
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
})
