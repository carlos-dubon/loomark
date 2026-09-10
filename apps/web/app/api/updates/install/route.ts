import { errorMessage } from "@loomark/core/format"
import {
  SELF_UPDATE_MESSAGES,
  type SelfUpdateBlocker,
} from "@loomark/core/updates"

import { withOwner } from "@/lib/admin"
import { jsonError } from "@/lib/api"
import {
  discardParkedUpdates,
  startSelfUpdate,
  updateJob,
} from "@/lib/updates/self-update"

export const dynamic = "force-dynamic"

export const GET = withOwner(async () => Response.json(updateJob()))

export const POST = withOwner(async () => {
  try {
    return Response.json(await startSelfUpdate())
  } catch (cause) {
    const reason = errorMessage(cause, "")
    const blocked = SELF_UPDATE_MESSAGES[reason as SelfUpdateBlocker]

    return jsonError(
      blocked ?? "Could not start the update",
      blocked ? 409 : 500
    )
  }
})

export const DELETE = withOwner(async () =>
  Response.json({ discarded: await discardParkedUpdates() })
)
