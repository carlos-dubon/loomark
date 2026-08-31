import { z } from "zod"

import {
  bookmarkDescription,
  collectionName,
  iconSlug,
  serverUrlField,
} from "@loomark/core/schemas"

export const serverUrlSchema = z.object({
  serverUrl: serverUrlField,
})

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
})

export const bookmarkFormSchema = z.object({
  title: z.string().trim().max(300),
  description: bookmarkDescription,
  collectionId: z.string().nullable(),
  pinned: z.boolean(),
})

export const collectionFormSchema = z.object({
  name: collectionName.min(1, "Give the collection a name"),
  icon: iconSlug.nullable(),
  parentId: z.string().nullable(),
})

export type ServerUrlValues = z.infer<typeof serverUrlSchema>
export type CredentialsValues = z.infer<typeof credentialsSchema>
export type BookmarkFormValues = z.infer<typeof bookmarkFormSchema>
export type CollectionFormValues = z.infer<typeof collectionFormSchema>
