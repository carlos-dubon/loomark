import { isNewer, type UpdateStatus } from "@loomark/core/updates"

import { withOwner } from "@/lib/server/admin"
import { fetchLatestRelease } from "@/lib/server/updates/github"
import {
  appVersion,
  parkedUpdates,
  selfUpdateSupport,
} from "@/lib/server/updates/self-update"

export const GET = withOwner(async (request) => {
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
})
