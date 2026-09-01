import { createHash } from "node:crypto"

import { isBookmarkable, safeNormalizeUrl } from "@loomark/core/url"

import { ensureUnsortedCollection } from "@/lib/collections"
import { prisma } from "@/lib/prisma"
import {
  containerOf,
  nextSiblingPosition,
  unsortedCollectionId,
} from "@/lib/siblings"

import type { Sibling } from "@loomark/core/order"

export const ROOT_ID = "-1"

export type BookmarkNode = {
  type: "bookmark"
  id: string
  title: string
  url: string
  position: number
}

export type FolderNode = {
  type: "folder"
  id: string
  title: string | undefined
  parentId: string
  position: number
  children: TreeNode[]
}

export type TreeNode = BookmarkNode | FolderNode

export type FloccusTree = {
  root: FolderNode
  folders: Map<string, FolderNode>
  unsortedId: string | null
}

const RANK = { folder: 0, bookmark: 1 } as const

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const nodeTitle = (node: TreeNode) => node.title ?? ""

const byPosition = (a: TreeNode, b: TreeNode) =>
  a.position - b.position ||
  RANK[a.type] - RANK[b.type] ||
  compareText(nodeTitle(a), nodeTitle(b)) ||
  compareText(a.id, b.id)

export const folderIdOf = (
  collectionId: string | null,
  unsortedId: string | null
) => (!collectionId || collectionId === unsortedId ? ROOT_ID : collectionId)

export const loadTree = async (userId: string): Promise<FloccusTree> => {
  const [collections, bookmarks] = await Promise.all([
    prisma.collection.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        kind: true,
        parentId: true,
        position: true,
      },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        url: true,
        collectionId: true,
        position: true,
      },
    }),
  ])

  const unsortedId =
    collections.find((collection) => collection.kind === "UNSORTED")?.id ?? null

  const root: FolderNode = {
    type: "folder",
    id: ROOT_ID,
    title: undefined,
    parentId: ROOT_ID,
    position: 0,
    children: [],
  }

  const folders = new Map<string, FolderNode>([[ROOT_ID, root]])

  for (const collection of collections) {
    if (collection.id === unsortedId) {
      continue
    }

    folders.set(collection.id, {
      type: "folder",
      id: collection.id,
      title: collection.name,
      parentId: folderIdOf(collection.parentId, unsortedId),
      position: collection.position,
      children: [],
    })
  }

  for (const folder of folders.values()) {
    if (folder.id !== ROOT_ID) {
      folders.get(folder.parentId)?.children.push(folder)
    }
  }

  for (const bookmark of bookmarks) {
    folders.get(folderIdOf(bookmark.collectionId, unsortedId))?.children.push({
      type: "bookmark",
      id: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      position: bookmark.position,
    })
  }

  for (const folder of folders.values()) {
    folder.children.sort(byPosition)
  }

  return { root, folders, unsortedId }
}

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex")

export const hashNode = (node: TreeNode): string =>
  node.type === "bookmark"
    ? sha256(JSON.stringify({ title: node.title, url: node.url }))
    : sha256(
        JSON.stringify({
          title: node.title,
          children: node.children.map(hashNode),
        })
      )

const deeper = (layers: number) => (layers === -1 ? -1 : layers - 1)

const descend = (layers: number) => layers === -1 || layers > 1

export const serializeChildren = (
  folder: FolderNode,
  layers: number
): unknown[] =>
  folder.children.map((child) =>
    child.type === "bookmark"
      ? { type: "bookmark", id: child.id, title: child.title, url: child.url }
      : {
          type: "folder",
          id: child.id,
          title: child.title,
          parentId: folder.id,
          ...(descend(layers)
            ? { children: serializeChildren(child, deeper(layers)) }
            : {}),
        }
  )

export const serializeFolders = (
  folder: FolderNode,
  layers: number
): unknown[] =>
  folder.children
    .filter((child): child is FolderNode => child.type === "folder")
    .map((child) => ({
      id: child.id,
      title: child.title,
      parentId: folder.id,
      ...(layers === -1 || layers > 0
        ? { children: serializeFolders(child, deeper(layers)) }
        : {}),
    }))

export const bookmarkItem = (
  bookmark: { id: string; title: string; url: string; collectionId: string },
  unsortedId: string | null
) => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  folders: [folderIdOf(bookmark.collectionId, unsortedId)],
  tags: [],
})

export { unsortedCollectionId }

export const collectionIdForFolder = async (
  userId: string,
  folderId: string
) =>
  folderId === ROOT_ID
    ? await ensureUnsortedCollection(userId)
    : ((await ownedCollection(userId, folderId))?.id ?? null)

export const floccusUrl = (value: string) =>
  isBookmarkable(value.trim()) ? safeNormalizeUrl(value) : null

export const bookmarkTitleOf = (title: string | undefined, url: string) =>
  title?.trim().slice(0, 300) || new URL(url).hostname

export const ownedCollection = (userId: string, id: string) =>
  prisma.collection.findFirst({
    where: { id, userId, kind: "USER" },
    select: { id: true, name: true, parentId: true },
  })

export const siblingOf = (node: TreeNode): Sibling => ({
  type: node.type === "folder" ? "collection" : "bookmark",
  id: node.id,
  title: node.title ?? "",
  position: node.position,
})

export const nextChildPosition = (
  userId: string,
  folderId: string,
  unsortedId: string | null
) =>
  nextSiblingPosition(
    userId,
    containerOf(folderId === ROOT_ID ? null : folderId, unsortedId),
    unsortedId
  )
