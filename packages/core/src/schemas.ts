import { z } from "zod"

import { safeNormalizeUrl } from "./url"

export const ICON_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const iconSlug = z
  .string()
  .trim()
  .max(64)
  .regex(ICON_SLUG, "Pick an icon from the list")

export const collectionName = z.string().trim().min(1).max(80)
export const bookmarkTitle = z.string().trim().min(1).max(300)
export const bookmarkDescription = z.string().trim().max(2000)
export const urlString = z.string().trim().min(1).max(2000)
export const emailField = z.email().trim().toLowerCase()
export const passwordField = z.string().min(8).max(200)
export const idField = z.string().min(1).max(60)

export const serverUrlField = z
  .string()
  .trim()
  .min(1, "Enter your Loomark URL")
  .max(2000)
  .refine(
    (value) => safeNormalizeUrl(value) !== null,
    "That does not look like a URL"
  )
