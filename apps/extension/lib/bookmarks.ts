import { browser } from "wxt/browser"

import { isBookmarkable } from "@loomark/core/url"

type TreeNode = {
  id: string
  title: string
  url?: string
  type?: string
  children?: TreeNode[]
}

export type NativeNode = {
  id: string
  parentId: string
  title: string
  url: string | null
  index: number
}

const isFolder = (node: TreeNode) =>
  node.url === undefined && node.type !== "separator"

export const hasBookmarksPermission = () =>
  browser.permissions.contains({ permissions: ["bookmarks"] })

export const requestBookmarksPermission = () =>
  browser.permissions.request({ permissions: ["bookmarks"] })

const collect = (nodes: TreeNode[], parentId: string, into: NativeNode[]) => {
  let index = 0

  for (const node of nodes) {
    if (isFolder(node)) {
      into.push({
        id: node.id,
        parentId,
        title: node.title,
        url: null,
        index: index++,
      })
      collect(node.children ?? [], node.id, into)
      continue
    }

    if (isBookmarkable(node.url)) {
      into.push({
        id: node.id,
        parentId,
        title: node.title,
        url: node.url,
        index: index++,
      })
    }
  }
}

export const readSubtree = async (rootId: string) => {
  const [root] = await browser.bookmarks.getSubTree(rootId).catch(() => [])

  if (!root || !isFolder(root)) {
    return null
  }

  const nodes: NativeNode[] = []

  collect(root.children ?? [], root.id, nodes)

  return nodes
}

const TOOLBAR_IDS = ["1", "toolbar_____"]

export const bookmarksBarId = async () => {
  const [root] = await browser.bookmarks.getTree()
  const shelves = (root?.children ?? []).filter(isFolder)

  return (
    shelves.find((node) => TOOLBAR_IDS.includes(node.id))?.id ??
    shelves[0]?.id ??
    null
  )
}

export const createFolder = async (parentId: string, title: string) =>
  (await browser.bookmarks.create({ parentId, title })).id

export const createLink = async (
  parentId: string,
  title: string,
  url: string
) => (await browser.bookmarks.create({ parentId, title, url })).id

export const renameNode = (id: string, title: string) =>
  browser.bookmarks.update(id, { title })

export const retargetLink = (id: string, url: string) =>
  browser.bookmarks.update(id, { url })

export const moveNode = (id: string, parentId: string) =>
  browser.bookmarks.move(id, { parentId })


export const removeLink = (id: string) => browser.bookmarks.remove(id)

export const removeFolder = (id: string) => browser.bookmarks.removeTree(id)
