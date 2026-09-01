import { floccusError, floccusOk } from "@/lib/floccus/respond"
import { floccusFolderSchema, parseFloccusBody } from "@/lib/floccus/schemas"
import { floccusSession } from "@/lib/floccus/session"
import {
  ROOT_ID,
  loadTree,
  nextChildPosition,
  ownedCollection,
  serializeFolders,
  unsortedCollectionId,
} from "@/lib/floccus/tree"
import { prisma } from "@/lib/prisma"

const DEFAULT_NAME = "Untitled"

const MAX_NAME = 80

export const GET = async (request: Request) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { searchParams } = new URL(request.url)
  const root = searchParams.get("root") ?? ROOT_ID
  const layers = Number.parseInt(searchParams.get("layers") ?? "0", 10)

  const tree = await loadTree(session.userId)
  const folder = tree.folders.get(root)

  if (!folder) {
    return floccusError("Folder not found", 404)
  }

  return floccusOk(session, {
    data: serializeFolders(folder, Number.isFinite(layers) ? layers : 0),
  })
}

export const POST = async (request: Request) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const body = await parseFloccusBody(request, floccusFolderSchema)

  if (!body) {
    return floccusError("Invalid request body", 422)
  }

  const folderId = body.parent_folder ?? ROOT_ID
  let parentId: string | null = null

  if (folderId !== ROOT_ID) {
    const parent = await ownedCollection(session.userId, folderId)

    if (!parent) {
      return floccusError("Parent folder not found", 404)
    }

    parentId = parent.id
  }

  const collection = await prisma.collection.create({
    data: {
      userId: session.userId,
      name: body.title?.trim().slice(0, MAX_NAME) || DEFAULT_NAME,
      parentId,
      position: await nextChildPosition(
        session.userId,
        folderId,
        await unsortedCollectionId(session.userId)
      ),
    },
    select: { id: true, name: true },
  })

  return floccusOk(session, {
    item: {
      id: collection.id,
      title: collection.name,
      parent_folder: folderId,
    },
  })
}
