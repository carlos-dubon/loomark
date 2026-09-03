import { useEffect, useState } from "react"

import { readSyncStatus, watchSyncStatus, type SyncStatus } from "@/lib/storage"

const STALE_AFTER = 2 * 60 * 1000
const TICK = 15000

export const useSyncStatus = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [now, setNow] = useState(0)

  useEffect(() => {
    void readSyncStatus().then((current) => {
      setStatus(current)
      setNow(Date.now())
    })
  }, [])

  useEffect(() => watchSyncStatus(setStatus), [])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK)

    return () => clearInterval(timer)
  }, [])

  return {
    status,
    now,
    syncing:
      Boolean(status?.running) && now - (status?.startedAt ?? 0) < STALE_AFTER,
  }
}
