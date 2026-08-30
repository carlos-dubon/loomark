import { z } from "zod"

import { safeNormalizeUrl } from "@/lib/url"

export const serverUrlSchema = z.object({
  serverUrl: z
    .string()
    .trim()
    .min(1, "Enter your Loomark URL")
    .max(2000)
    .refine(
      (value) => safeNormalizeUrl(value) !== null,
      "That does not look like a URL"
    ),
})

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
})

export const bookmarkFormSchema = z.object({
  title: z.string().trim().max(300),
  description: z.string().trim().max(2000),
  collectionId: z.string().nullable(),
  pinned: z.boolean(),
})

export const collectionFormSchema = z.object({
  name: z.string().trim().min(1, "Give the collection a name").max(80),
  icon: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Pick an icon from the list")
    .nullable(),
  parentId: z.string().nullable(),
})

export type ServerUrlValues = z.infer<typeof serverUrlSchema>
export type CredentialsValues = z.infer<typeof credentialsSchema>
export type BookmarkFormValues = z.infer<typeof bookmarkFormSchema>
export type CollectionFormValues = z.infer<typeof collectionFormSchema>
