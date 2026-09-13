"use client"

import { useQuery } from "@tanstack/react-query"

import type { CollectionDTO } from "@loomark/core/types"

import { collectionsQuery } from "@/lib/client/queries"

const NO_COLLECTIONS: CollectionDTO[] = []

export const useCollections = () =>
  useQuery(collectionsQuery).data ?? NO_COLLECTIONS
