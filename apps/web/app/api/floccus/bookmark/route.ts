import { safeNormalizeUrl } from "@loomark/core/url"

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

import type { Prisma } from "@/lib/generated/prisma/client"

const PAGE_LIMIT = 300

const MAX_ROWS = 10000

export const GET = async (request: Request) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { searchParams } = new URL(request.url)
  const target = searchParams.get("url")
  const terms = searchParams.getAll("search[]")
  const page = Number.parseInt(searchParams.get("page") ?? "0", 10)
  const limit = Number.parseInt(searchParams.get("limit") ?? "", 10)

  const where: Prisma.BookmarkWhereInput = { userId: session.userId }

  if (target) {
    where.url = safeNormalizeUrl(target) ?? target
  }

  if (terms.length > 0) {
    where.AND = terms.map((term) => ({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { url: { contains: term, mode: "insensitive" } },
      ],
    }))
  }

  const take = Number.isFinite(limit) && limit > 0 ? limit : PAGE_LIMIT
  const paged = Number.isFinite(page) && page >= 0

  const [unsortedId, bookmarks] = await Promise.all([
    unsortedCollectionId(session.userId),
    prisma.bookmark.findMany({
      where,
      orderBy: { id: "asc" },
      ...(paged
        ? { skip: page * take, take }
        : { take: Math.min(take, MAX_ROWS) }),
      select: { id: true, title: true, url: true, collectionId: true },
    }),
  ])

  return floccusOk(session, {
    data: bookmarks.map((bookmark) => bookmarkItem(bookmark, unsortedId)),
  })
}

export const POST = async (request: Request) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const body = await parseFloccusBody(request, floccusBookmarkSchema)

  if (!body) {
    return floccusError("Invalid request body", 422)
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

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: session.userId,
      url,
      title: bookmarkTitleOf(body.title, url),
      collectionId,
      position: await nextChildPosition(session.userId, folderId, unsortedId),
    },
    select: { id: true, title: true, url: true, collectionId: true },
  })

  return floccusOk(session, { item: bookmarkItem(bookmark, unsortedId) })
}
