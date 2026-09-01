import { z } from "zod"

import type { ZodType } from "zod"

const looseTitle = z.string().optional()

const floccusId = z.union([z.string(), z.number()]).transform(String)

export const floccusBookmarkSchema = z.object({
  url: z.string().trim().min(1).max(2000),
  title: looseTitle,
  folders: z.array(floccusId).optional(),
  tags: z.array(z.string()).optional(),
})

export const floccusFolderSchema = z.object({
  title: looseTitle,
  parent_folder: floccusId.optional(),
})

export const floccusChildOrderSchema = z.object({
  data: z.array(
    z.object({ id: floccusId, type: z.enum(["bookmark", "folder"]) })
  ),
})

export const parseFloccusBody = async <T>(
  request: Request,
  schema: ZodType<T>
) => {
  const raw = await request.json().catch(() => null)
  const result = schema.safeParse(raw)

  return result.success ? result.data : null
}
