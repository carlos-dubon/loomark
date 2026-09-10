import { deleteInstanceUser, getUserRole, withOwner } from "@/lib/server/admin"
import { jsonError } from "@/lib/server/api"

type Context = { params: Promise<{ id: string }> }

export const DELETE = withOwner(
  async (_request, ownerId, { params }: Context) => {
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
)
