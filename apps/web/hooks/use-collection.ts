"use client"

import { useCollections } from "@/hooks/use-collections"

export const useCollection = (collectionId: string) =>
  useCollections().find((item) => item.id === collectionId) ?? null
