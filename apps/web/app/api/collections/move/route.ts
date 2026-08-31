import {
  applyCollectionMove,
  changedCollections,
  collectDescendantIds,
} from "@loomark/core/tree"

import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { getCollections } from "@/lib/queries"
import { collectionMoveSchema } from "@/lib/schemas"

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, collectionMoveSchema)

  if (!data) {
    return response
  }

  const collections = await getCollections(userId)
  const moving = collections.find((collection) => collection.id === data.id)

  if (!moving) {
    return jsonError("Collection not found", 404)
  }

  if (moving.kind === "UNSORTED") {
    return jsonError("Unsorted cannot be moved", 400)
  }

  if (data.parentId) {
    const parent = collections.find(
      (collection) => collection.id === data.parentId
    )

    if (!parent) {
      return jsonError("Parent collection not found", 404)
    }

    if (parent.kind === "UNSORTED") {
      return jsonError("Unsorted cannot hold collections", 400)
    }

    if (collectDescendantIds(collections, data.id).includes(data.parentId)) {
      return jsonError("A collection cannot be moved into itself", 400)
    }
  }

  const next = applyCollectionMove(
    collections,
    data.id,
    data.parentId,
    data.index
  )
  const changed = changedCollections(collections, next)

  if (changed.length > 0) {
    await prisma.$transaction(
      changed.map((collection) =>
        prisma.collection.update({
          where: { id: collection.id },
          data: {
            parentId: collection.parentId,
            position: collection.position,
          },
        })
      )
    )
  }

  return Response.json(next)
}
