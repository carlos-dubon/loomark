"use client"

import { useAtomValue, useSetAtom } from "jotai"
import {
  ExternalLinkIcon,
  FolderInputIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  Trash2Icon,
} from "lucide-react"
import { useMemo } from "react"

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
import { useBookmarkActions } from "@/hooks/use-bookmark-actions"
import { buildCollectionTree, flattenTree } from "@/lib/tree"
import type { BookmarkDTO } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  bookmarkDialogAtom,
  collectionsAtom,
  deleteDialogAtom,
} from "@/store/atoms"

export const BookmarkMenu = ({
  bookmark,
  className,
}: {
  bookmark: BookmarkDTO
  className?: string
}) => {
  const collections = useAtomValue(collectionsAtom)
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)
  const confirmDelete = useSetAtom(deleteDialogAtom)
  const { togglePin, move, copyLink } = useBookmarkActions()

  const flat = useMemo(
    () => flattenTree(buildCollectionTree(collections)),
    [collections]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Bookmark actions"
            className={cn(
              "text-muted-foreground transition-opacity hover:text-foreground focus-visible:opacity-100 aria-expanded:opacity-100",
              className
            )}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 min-w-52">
        <DropdownMenuItem
          onClick={() => window.open(bookmark.url, "_blank", "noopener")}
        >
          <ExternalLinkIcon />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyLink(bookmark)}>
          <LinkIcon />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openBookmarkDialog({
              open: true,
              bookmark,
              collectionId: bookmark.collectionId,
            })
          }
        >
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePin(bookmark)}>
          {bookmark.pinned ? <PinOffIcon /> : <PinIcon />}
          {bookmark.pinned ? "Unpin" : "Pin to homepage"}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInputIcon />
            Move to
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 min-w-56 overflow-hidden">
            <div className="no-scrollbar max-h-72 scroll-fade-y overflow-y-auto">
              {flat.map((node) => (
                <DropdownMenuItem
                  key={node.id}
                  disabled={bookmark.collectionId === node.id}
                  onClick={() => move(bookmark, node.id)}
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
        <DropdownMenuItem
          variant="destructive"
          onClick={() => confirmDelete([bookmark])}
        >
          <Trash2Icon />
          Delete bookmark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
