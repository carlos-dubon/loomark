import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(200),
})

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
})

export const bookmarkCreateSchema = z.object({
  url: z.string().trim().min(1).max(2000),
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(2000).nullish(),
  faviconUrl: z.string().trim().max(2000).nullish(),
  previewUrl: z.string().trim().max(2000).nullish(),
  collectionId: z.string().min(1).nullish(),
  pinned: z.boolean().optional(),
})

export const bookmarkUpdateSchema = bookmarkCreateSchema.partial()

export const bookmarkQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  collectionId: z.string().min(1).optional(),
  pinned: z.enum(["true", "false"]).optional(),
  unsorted: z.enum(["true", "false"]).optional(),
  take: z.coerce.number().int().min(1).max(200).default(60),
  skip: z.coerce.number().int().min(0).default(0),
})

export const collectionCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  parentId: z.string().min(1).nullish(),
})

export const collectionUpdateSchema = collectionCreateSchema.partial()

export const collectionMoveSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  index: z.number().int().min(0),
})

export const metadataQuerySchema = z.object({
  url: z.url(),
})

export type BookmarkCreateInput = z.infer<typeof bookmarkCreateSchema>
export type BookmarkUpdateInput = z.infer<typeof bookmarkUpdateSchema>
export type CollectionCreateInput = z.infer<typeof collectionCreateSchema>
export type CollectionUpdateInput = z.infer<typeof collectionUpdateSchema>
export type CollectionMoveInput = z.infer<typeof collectionMoveSchema>
