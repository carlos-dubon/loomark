"use client"

import { useAtomValue, useSetAtom } from "jotai"
import {
  FolderInputIcon,
  FolderPlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useMemo } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCollectionActions } from "@/hooks/use-collection-actions"
import { api } from "@/lib/client-api"
import {
  buildCollectionTree,
  collectDescendantIds,
  flattenTree,
} from "@/lib/tree"
import type { CollectionDTO } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  bookmarkDialogAtom,
  collectionDialogAtom,
  collectionsAtom,
  removeCollectionAtom,
} from "@/store/atoms"

export const CollectionMenu = ({
  collection,
  className,
  align = "end",
}: {
  collection: CollectionDTO
  className?: string
  align?: "start" | "end"
}) => {
  const pathname = usePathname()
  const router = useRouter()
  const openCollectionDialog = useSetAtom(collectionDialogAtom)
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)
  const removeCollection = useSetAtom(removeCollectionAtom)
  const collections = useAtomValue(collectionsAtom)
  const { move } = useCollectionActions()

  const href = `/collections/${collection.id}`

  const moveTargets = useMemo(() => {
    const excluded = new Set(collectDescendantIds(collections, collection.id))
    return flattenTree(buildCollectionTree(collections)).filter(
      (node) => node.kind === "USER" && !excluded.has(node.id)
    )
  }, [collections, collection.id])

  const onMove = async (newParentId: string | null) => {
    if (newParentId === collection.parentId) {
      return
    }

    if (!(await move(collection.id, newParentId))) {
      return
    }

    const parentName = newParentId
      ? (moveTargets.find((node) => node.id === newParentId)?.name ?? null)
      : null

    toast.success(
      parentName
        ? `Moved “${collection.name}” to “${parentName}”`
        : `Moved “${collection.name}” to top level`
    )
  }

  const onDelete = async () => {
    try {
      await api.deleteCollection(collection.id)
      removeCollection(collection.id)
      toast.success(`Deleted “${collection.name}”`)

      if (pathname.startsWith(href)) {
        router.push("/")
      }

      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Delete failed")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className={cn(className)}
            aria-label={`Actions for ${collection.name}`}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52 min-w-52">
        <DropdownMenuItem
          onClick={() =>
            openBookmarkDialog({
              open: true,
              bookmark: null,
              collectionId: collection.id,
            })
          }
        >
          <PlusIcon />
          Add bookmark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openCollectionDialog({
              open: true,
              collection: null,
              parentId: collection.id,
            })
          }
        >
          <FolderPlusIcon />
          New nested collection
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openCollectionDialog({
              open: true,
              collection,
              parentId: collection.parentId,
            })
          }
        >
          <PencilIcon />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInputIcon />
            Move to…
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 min-w-56 overflow-hidden">
            <div className="no-scrollbar max-h-72 scroll-fade-y overflow-y-auto">
              <DropdownMenuItem
                disabled={collection.parentId === null}
                onClick={() => onMove(null)}
              >
                <span className="truncate">Top level</span>
              </DropdownMenuItem>
              {moveTargets.length > 0 ? <DropdownMenuSeparator /> : null}
              {moveTargets.map((node) => (
                <DropdownMenuItem
                  key={node.id}
                  disabled={node.id === collection.parentId}
                  onClick={() => onMove(node.id)}
                >
                  <span
                    className="truncate"
                    style={{ paddingLeft: node.depth * 10 }}
                  >
                    {node.name}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
