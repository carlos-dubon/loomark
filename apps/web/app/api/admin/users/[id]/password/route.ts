import { hash } from "bcryptjs"

import { getUserRole, withOwner } from "@/lib/admin"
import { jsonError, parseBody } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { passwordResetSchema } from "@/lib/schemas"

type Context = { params: Promise<{ id: string }> }

export const POST = withOwner(async (request, ownerId, { params }: Context) => {
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
})
