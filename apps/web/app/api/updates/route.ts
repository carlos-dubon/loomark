import { isNewer, type UpdateStatus } from "@loomark/core/updates"

import { requireOwnerId } from "@/lib/admin"
import { jsonError } from "@/lib/api"
import { fetchLatestRelease } from "@/lib/updates/github"
import {
  appVersion,
  parkedUpdates,
  selfUpdateSupport,
} from "@/lib/updates/self-update"

export const GET = async (request: Request) => {
  if (!(await requireOwnerId())) {
    return jsonError("Unauthorized", 401)
  }

  const force = new URL(request.url).searchParams.get("force") === "1"

  const [latest, selfUpdate, parked] = await Promise.all([
    fetchLatestRelease({ force }),
    selfUpdateSupport(),
    parkedUpdates(),
  ])

  const status: UpdateStatus = {
    current: appVersion,
    latest,
    available: latest ? isNewer(latest.version, appVersion) : false,
    selfUpdate,
    parked,
  }

  return Response.json(status)
}
