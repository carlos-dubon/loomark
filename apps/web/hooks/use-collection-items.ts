"use client"

import { useMemo } from "react"

import { buildCollectionTree, flattenTree } from "@loomark/core/tree"

import { useCollections } from "@/hooks/use-collections"

export const useCollectionItems = () => {
  const collections = useCollections()

  return useMemo(() => {
    const tree = buildCollectionTree(collections)

    return {
      unsorted: tree.find((node) => node.kind === "UNSORTED") ?? null,
      items: flattenTree(tree.filter((node) => node.kind === "USER")),
    }
  }, [collections])
}
