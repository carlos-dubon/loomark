import { deleteInstanceUser, getUserRole, requireOwnerId } from "@/lib/admin"
import { jsonError } from "@/lib/api"

type Context = { params: Promise<{ id: string }> }

export const DELETE = async (_request: Request, { params }: Context) => {
  const ownerId = await requireOwnerId()

  if (!ownerId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params

  if (id === ownerId) {
    return jsonError("The owner account cannot be deleted", 400)
  }

  const role = await getUserRole(id)

  if (!role) {
    return jsonError("User not found", 404)
  }

  if (role === "OWNER") {
    return jsonError("The owner account cannot be deleted", 400)
  }

  await deleteInstanceUser(id)

  return new Response(null, { status: 204 })
}
