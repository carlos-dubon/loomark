import { hash } from "bcryptjs"

import { getUserRole, requireOwnerId } from "@/lib/admin"
import { jsonError, parseBody } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { passwordResetSchema } from "@/lib/schemas"

type Context = { params: Promise<{ id: string }> }

export const POST = async (request: Request, { params }: Context) => {
  const ownerId = await requireOwnerId()

  if (!ownerId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const { data, response } = await parseBody(request, passwordResetSchema)

  if (!data) {
    return response
  }

  if (!(await getUserRole(id))) {
    return jsonError("User not found", 404)
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { passwordHash: await hash(data.password, 12) },
    }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ])

  return new Response(null, { status: 204 })
}
