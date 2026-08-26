"use client"

import { useAtomValue } from "jotai"

import { collectionsAtom } from "@/store/atoms"

export const useCollectionName = (collectionId: string) =>
  useAtomValue(collectionsAtom).find((item) => item.id === collectionId)
    ?.name ?? null
