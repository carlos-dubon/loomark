import {
  ROOT_ID,
  bookmarkTitleOf,
  floccusUrl,
  nextChildPosition,
} from "@/lib/floccus/tree"
import type { NetscapeFolder } from "@/lib/netscape"
import { prisma } from "@/lib/prisma"

const MAX_ITEMS = 500

const MAX_DEPTH = 20

const MAX_NAME = 80

const DEFAULT_NAME = "Untitled"

export type ImportedNode =
  | { type: "bookmark"; id: string; title: string; url: string }
  | { type: "folder"; id: string; title: string; children: ImportedNode[] }

const walk = async (
  userId: string,
  folderId: string,
  folder: NetscapeFolder,
  unsortedId: string | null,
  budget: { left: number },
  depth: number
): Promise<ImportedNode[]> => {
  const parentId = folderId === ROOT_ID ? null : folderId
  const collectionId = folderId === ROOT_ID ? unsortedId : folderId

  let position = await nextChildPosition(userId, folderId, unsortedId)

  const nodes: ImportedNode[] = []

  for (const child of folder.folders) {
    if (budget.left <= 0 || depth >= MAX_DEPTH) {
      break
    }

    budget.left -= 1

    const created = await prisma.collection.create({
      data: {
        userId,
        name: child.name.trim().slice(0, MAX_NAME) || DEFAULT_NAME,
        parentId,
        position: position++,
      },
      select: { id: true, name: true },
    })

    nodes.push({
      type: "folder",
      id: created.id,
      title: created.name,
      children: await walk(
        userId,
        created.id,
        child,
        unsortedId,
        budget,
        depth + 1
      ),
    })
  }

  if (!collectionId) {
    return nodes
  }

  const existing = new Map(
    (
      await prisma.bookmark.findMany({
        where: { userId, collectionId },
        select: { id: true, title: true, url: true },
      })
    ).map((bookmark) => [bookmark.url, bookmark])
  )

  for (const bookmark of folder.bookmarks) {
    if (budget.left <= 0) {
      break
    }

    const url = floccusUrl(bookmark.url)

    if (!url) {
      continue
    }

    budget.left -= 1

    const match = existing.get(url)

    if (match) {
      nodes.push({
        type: "bookmark",
        id: match.id,
        title: match.title,
        url: match.url,
      })
      continue
    }

    const created = await prisma.bookmark.create({
      data: {
        userId,
        url,
        title: bookmarkTitleOf(bookmark.title, url),
        description: bookmark.description?.slice(0, 2000) ?? null,
        faviconUrl: bookmark.faviconUrl,
        collectionId,
        position: position++,
        ...(bookmark.addDate ? { createdAt: bookmark.addDate } : {}),
      },
      select: { id: true, title: true, url: true },
    })

    existing.set(created.url, created)

    nodes.push({
      type: "bookmark",
      id: created.id,
      title: created.title,
      url: created.url,
    })
  }

  return nodes
}

export const importIntoFolder = async (
  userId: string,
  folderId: string,
  unsortedId: string | null,
  folder: NetscapeFolder
) => walk(userId, folderId, folder, unsortedId, { left: MAX_ITEMS }, 0)
