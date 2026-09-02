import { z } from "zod"

import { ARCHIVE_FORMATS } from "@loomark/core/archive"
import {
  bookmarkDescription,
  bookmarkTitle,
  collectionName,
  emailField,
  iconSlug,
  ICON_SLUG,
  idField,
  passwordField,
  urlString,
} from "@loomark/core/schemas"
import { NOISE_LEVELS, SIDEBAR_SIDES } from "@loomark/core/sidebar"
import { ORDER_SCOPES, SORT_ORDERS } from "@loomark/core/sort"
import { VIEW_MODES } from "@loomark/core/view-mode"

export const registerSchema = z.object({
  name: collectionName,
  email: emailField,
  password: passwordField,
})

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
})

export const apiTokenCreateSchema = loginSchema.extend({
  name: collectionName.optional(),
})

export const passwordResetSchema = z.object({
  password: passwordField,
})

export const bookmarkCreateSchema = z.object({
  url: urlString,
  title: bookmarkTitle.optional(),
  description: bookmarkDescription.nullish(),
  faviconUrl: z.string().trim().max(2000).nullish(),
  previewUrl: z.string().trim().max(2000).nullish(),
  collectionId: z.string().min(1).nullish(),
  pinned: z.boolean().optional(),
})

export const bookmarkUpdateSchema = bookmarkCreateSchema.partial()

export const bookmarkLookupSchema = z.object({
  url: urlString,
})

export const bookmarkQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  collectionId: z.string().min(1).optional(),
  pinned: z.enum(["true", "false"]).optional(),
  unsorted: z.enum(["true", "false"]).optional(),
  take: z.coerce.number().int().min(1).max(200).default(60),
  skip: z.coerce.number().int().min(0).default(0),
})

export const bookmarkReorderSchema = z.object({
  scope: z.enum(ORDER_SCOPES),
  collectionId: z.string().min(1).nullish(),
  ids: z.array(idField).min(1).max(500),
})

export const collectionCreateSchema = z.object({
  name: collectionName,
  icon: iconSlug.nullish(),
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

const slug = z.string().trim().max(64).regex(ICON_SLUG, "Unknown preset")

export const appearanceUpdateSchema = z
  .object({
    themePreset: slug,
    viewMode: z.enum(VIEW_MODES),
    sortOrder: z.enum(SORT_ORDERS),
    sidebarSide: z.enum(SIDEBAR_SIDES),
    sidebarNoise: z.enum(NOISE_LEVELS),
  })
  .partial()

export const archiveSettingsSchema = z
  .object(
    Object.fromEntries(
      ARCHIVE_FORMATS.map((format) => [format, z.boolean()])
    ) as Record<(typeof ARCHIVE_FORMATS)[number], z.ZodBoolean>
  )
  .partial()

export const archiveRunSchema = z.object({
  formats: z.array(z.enum(ARCHIVE_FORMATS)).min(1).optional(),
})

export const bookmarkBulkDeleteSchema = z.object({
  ids: z.array(idField).min(1).max(500),
})

export const bookmarkRestoreSchema = z.object({
  bookmarks: z
    .array(
      bookmarkCreateSchema.extend({
        id: idField,
        title: bookmarkTitle,
        position: z.number().int().min(0).optional(),
        pinnedPosition: z.number().int().min(0).optional(),
        createdAt: z.iso.datetime(),
      })
    )
    .min(1)
    .max(500),
})

export const collectionRestoreSchema = z.object({
  collections: z
    .array(
      collectionCreateSchema.extend({
        id: idField,
        name: collectionName,
        position: z.number().int().min(0),
      })
    )
    .min(1)
    .max(200),
  bookmarks: z
    .array(
      bookmarkCreateSchema.extend({
        id: idField,
        title: bookmarkTitle,
        collectionId: idField,
        position: z.number().int().min(0).optional(),
        pinnedPosition: z.number().int().min(0).optional(),
        createdAt: z.iso.datetime(),
      })
    )
    .max(5000),
})

export type ApiTokenCreateInput = z.infer<typeof apiTokenCreateSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type BookmarkCreateInput = z.infer<typeof bookmarkCreateSchema>
export type BookmarkUpdateInput = z.infer<typeof bookmarkUpdateSchema>
export type CollectionCreateInput = z.infer<typeof collectionCreateSchema>
export type CollectionUpdateInput = z.infer<typeof collectionUpdateSchema>
export type CollectionMoveInput = z.infer<typeof collectionMoveSchema>
export type AppearanceUpdateInput = z.infer<typeof appearanceUpdateSchema>
export type ArchiveSettingsInput = z.infer<typeof archiveSettingsSchema>
export type ArchiveRunInput = z.infer<typeof archiveRunSchema>
export type BookmarkBulkDeleteInput = z.infer<typeof bookmarkBulkDeleteSchema>
export type BookmarkReorderInput = z.infer<typeof bookmarkReorderSchema>
export type BookmarkRestoreInput = z.infer<typeof bookmarkRestoreSchema>
export type CollectionRestoreInput = z.infer<typeof collectionRestoreSchema>
