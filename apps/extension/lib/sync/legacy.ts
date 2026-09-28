import { moveNode, removeFolder } from "@/lib/bookmarks"
import type { SyncContext } from "@/lib/sync/context"
import { keyOf } from "@/lib/sync/utils"

export const dissolveUnsortedFolder = async ({
  rootId,
  unsortedId,
  links,
  nodes,
  childrenOf,
  relocate,
  drop,
}: SyncContext) => {
  const legacy = unsortedId
    ? links.get(keyOf("collection", unsortedId))
    : undefined
  const folder = legacy ? nodes.get(legacy.nodeId) : undefined

  if (!legacy || !folder) {
    return
  }

  for (const child of [...(childrenOf.get(folder.id) ?? [])]) {
    if (!nodes.has(child.id)) {
      continue
    }

    try {
      await moveNode(child.id, rootId)
      relocate(child, rootId)
    } catch {
      return
    }
  }

  try {
    await removeFolder(folder.id)
  } catch {
    return
  }

  nodes.delete(folder.id)
  childrenOf.set(
    rootId,
    (childrenOf.get(rootId) ?? []).filter((node) => node.id !== folder.id)
  )
  drop(legacy)
}
