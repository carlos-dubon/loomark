"use client"

import { useAtomValue, useSetAtom } from "jotai"
import {
  ArchiveIcon,
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

import { buildCollectionTree, flattenTree } from "@loomark/core/tree"
import type { BookmarkDTO } from "@loomark/core/types"
import { cn } from "@loomark/core/utils"
import { Button } from "@loomark/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@loomark/ui/components/dropdown-menu"

import { useBookmarkActions } from "@/hooks/use-bookmark-actions"
import { useOpenInNewTab } from "@/hooks/use-open-in-new-tab"
import {
  archiveDialogAtom,
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
  const openArchives = useSetAtom(archiveDialogAtom)
  const { togglePin, move, copyLink } = useBookmarkActions()
  const { open } = useOpenInNewTab()

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
        <DropdownMenuItem onClick={() => open(bookmark.url)}>
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
        <DropdownMenuItem onClick={() => openArchives(bookmark)}>
          <ArchiveIcon />
          Archived copies
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
