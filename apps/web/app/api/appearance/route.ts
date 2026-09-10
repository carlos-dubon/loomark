import { parseBody, withUser } from "@/lib/api"
import { getAppearance } from "@/lib/appearance"
import { prisma } from "@/lib/prisma"
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
