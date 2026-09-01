import { floccusError, floccusOk } from "@/lib/floccus/respond"
import { floccusBookmarkSchema, parseFloccusBody } from "@/lib/floccus/schemas"
import { floccusSession } from "@/lib/floccus/session"
import {
  ROOT_ID,
  bookmarkItem,
  bookmarkTitleOf,
  collectionIdForFolder,
  floccusUrl,
  nextChildPosition,
  unsortedCollectionId,
} from "@/lib/floccus/tree"
import { prisma } from "@/lib/prisma"

type Context = { params: Promise<{ id: string }> }

export const GET = async (_request: Request, { params }: Context) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { id } = await params

  const [unsortedId, bookmark] = await Promise.all([
    unsortedCollectionId(session.userId),
    prisma.bookmark.findFirst({
      where: { id, userId: session.userId },
      select: { id: true, title: true, url: true, collectionId: true },
    }),
  ])

  if (!bookmark) {
    return floccusError("Bookmark not found", 404)
  }

  return floccusOk(session, { item: bookmarkItem(bookmark, unsortedId) })
}

export const PUT = async (request: Request, { params }: Context) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { id } = await params
  const body = await parseFloccusBody(request, floccusBookmarkSchema)

  if (!body) {
    return floccusError("Invalid request body", 422)
  }

  const existing = await prisma.bookmark.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, collectionId: true },
  })

  if (!existing) {
    return floccusError("Bookmark not found", 404)
  }

  const url = floccusUrl(body.url)

  if (!url) {
    return floccusError("Only http and https bookmarks are supported", 422)
  }

  const folderId = body.folders?.at(-1) ?? ROOT_ID
  const collectionId = await collectionIdForFolder(session.userId, folderId)

  if (!collectionId) {
    return floccusError("Folder not found", 404)
  }

  const unsortedId = await unsortedCollectionId(session.userId)
  const moved = collectionId !== existing.collectionId

  const bookmark = await prisma.bookmark.update({
    where: { id: existing.id },
    data: {
      url,
      title: bookmarkTitleOf(body.title, url),
      collectionId,
      ...(moved
        ? {
            position: await nextChildPosition(
              session.userId,
              folderId,
              unsortedId
            ),
          }
        : {}),
    },
    select: { id: true, title: true, url: true, collectionId: true },
  })

  return floccusOk(session, { item: bookmarkItem(bookmark, unsortedId) })
}
