"use client"

import { useAtomValue } from "jotai"
import { useMemo } from "react"

import { buildCollectionTree, flattenTree } from "@loomark/core/tree"

import { collectionsAtom } from "@/store/atoms"

export const useCollectionItems = () => {
  const collections = useAtomValue(collectionsAtom)

  return useMemo(() => {
    const tree = buildCollectionTree(collections)

    return {
      unsorted: tree.find((node) => node.kind === "UNSORTED") ?? null,
      items: flattenTree(tree.filter((node) => node.kind === "USER")),
    }
  }, [collections])
}
