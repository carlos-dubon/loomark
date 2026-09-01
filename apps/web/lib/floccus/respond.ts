import type { FloccusSession } from "@/lib/floccus/session"

export const floccusOk = (
  session: FloccusSession,
  body: Record<string, unknown> = {}
) =>
  Response.json({
    status: "success",
    ...body,
    ...(session.ticket ? { ticket: session.ticket } : {}),
  })

export const floccusError = (message: string, status: number) =>
  Response.json({ status: "error", message }, { status })
