import {
  SELF_UPDATE_MESSAGES,
  type SelfUpdateBlocker,
} from "@loomark/core/updates"

import { requireOwnerId } from "@/lib/admin"
import { jsonError } from "@/lib/api"
import {
  discardParkedUpdates,
  startSelfUpdate,
  updateJob,
} from "@/lib/updates/self-update"

export const dynamic = "force-dynamic"

export const GET = async () => {
  if (!(await requireOwnerId())) {
    return jsonError("Unauthorized", 401)
  }

  return Response.json(updateJob())
}

export const POST = async () => {
  if (!(await requireOwnerId())) {
    return jsonError("Unauthorized", 401)
  }

  try {
    return Response.json(await startSelfUpdate())
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : ""
    const blocked = SELF_UPDATE_MESSAGES[reason as SelfUpdateBlocker]

    return jsonError(
      blocked ?? "Could not start the update",
      blocked ? 409 : 500
    )
  }
}

export const DELETE = async () => {
  if (!(await requireOwnerId())) {
    return jsonError("Unauthorized", 401)
  }

  return Response.json({ discarded: await discardParkedUpdates() })
}
