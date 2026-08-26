"use client"

import { useHydrateAtoms } from "jotai/utils"

import { BookmarkCard } from "@/components/bookmark-card"
import type { BookmarkDTO } from "@/lib/types"
import { collectionsAtom } from "@/store/atoms"

const make = (n: number): BookmarkDTO => ({
  id: `b${n}`,
  url: `https://example.com/path/${n}`,
  title: `Example bookmark number ${n} with a fairly long title`,
  description: "A description for the bookmark goes here.",
  faviconUrl: null,
  previewUrl: null,
  pinned: n % 3 === 0,
  collectionId: "c1",
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-20T10:00:00.000Z",
})

const items = Array.from({ length: 24 }, (_, i) => make(i + 1))

const Page = () => {
  useHydrateAtoms([
    [
      collectionsAtom,
      [
        {
          id: "c1",
          name: "Reading list",
          kind: "USER",
          parentId: null,
          bookmarkCount: 24,
        },
      ],
    ],
  ] as never)

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center border-b px-6 text-sm font-semibold">
        Harness
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 3).map((b) => (
            <BookmarkCard key={b.id} bookmark={b} mode="grid" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {items.map((b) => (
            <BookmarkCard key={b.id} bookmark={b} mode="list" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Page
