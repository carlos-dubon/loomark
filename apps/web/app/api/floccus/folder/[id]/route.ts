import { collectDescendantIds } from "@loomark/core/tree"

import { floccusError, floccusOk } from "@/lib/floccus/respond"
import { floccusFolderSchema, parseFloccusBody } from "@/lib/floccus/schemas"
import { floccusSession } from "@/lib/floccus/session"
import {
  ROOT_ID,
  nextChildPosition,
  ownedCollection,
  unsortedCollectionId,
} from "@/lib/floccus/tree"
import { prisma } from "@/lib/prisma"
import { getCollections } from "@/lib/queries"

type Context = { params: Promise<{ id: string }> }

const MAX_NAME = 80

export const PUT = async (request: Request, { params }: Context) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { id } = await params

  if (id === ROOT_ID) {
    return floccusError("The root folder cannot be changed", 400)
  }

  const body = await parseFloccusBody(request, floccusFolderSchema)

  if (!body) {
    return floccusError("Invalid request body", 422)
  }

  const existing = await ownedCollection(session.userId, id)

  if (!existing) {
    return floccusError("Folder not found", 404)
  }

  const folderId = body.parent_folder ?? ROOT_ID
  let parentId: string | null = null

  if (folderId !== ROOT_ID) {
    const parent = await ownedCollection(session.userId, folderId)

    if (!parent) {
      return floccusError("Parent folder not found", 404)
    }

    if (
      collectDescendantIds(await getCollections(session.userId), id).includes(
        parent.id
      )
    ) {
      return floccusError("A folder cannot be moved into itself", 400)
    }

    parentId = parent.id
  }

  const moved = parentId !== existing.parentId

  await prisma.collection.update({
    where: { id: existing.id },
    data: {
      name: body.title?.trim().slice(0, MAX_NAME) || existing.name,
      parentId,
      ...(moved
        ? {
            position: await nextChildPosition(
              session.userId,
              folderId,
              await unsortedCollectionId(session.userId)
            ),
          }
        : {}),
    },
  })

  return floccusOk(session)
}

export const DELETE = async (_request: Request, { params }: Context) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { id } = await params

  if (id === ROOT_ID) {
    return floccusError("The root folder cannot be deleted", 400)
  }

  const existing = await ownedCollection(session.userId, id)

  if (!existing) {
    return floccusError("Folder not found", 404)
  }

  const doomed = collectDescendantIds(
    await getCollections(session.userId),
    existing.id
  )

  await prisma.$transaction([
    prisma.bookmark.deleteMany({
      where: { userId: session.userId, collectionId: { in: doomed } },
    }),
    prisma.collection.delete({ where: { id: existing.id } }),
  ])

  return floccusOk(session)
}
