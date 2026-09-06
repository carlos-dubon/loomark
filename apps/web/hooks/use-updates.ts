"use client"

import { useAtom, useSetAtom } from "jotai"
import { useCallback, useEffect } from "react"
import { toast } from "sonner"

import { isUpdateRunning, type UpdateJob } from "@loomark/core/updates"

import { api } from "@/lib/client-api"
import { isDemo } from "@/lib/demo/config"
import { updateJobAtom, updateStatusAtom } from "@/store/atoms"

const CHECK_MS = 21_600_000
const JOB_POLL_MS = 1000
const HEALTH_POLL_MS = 2000
const SHUTDOWN_TIMEOUT_MS = 120_000
const RESTART_TIMEOUT_MS = 600_000

export const useUpdateWatcher = (enabled: boolean) => {
  const setStatus = useSetAtom(updateStatusAtom)

  useEffect(() => {
    if (!enabled || isDemo) {
      return
    }

    const controller = new AbortController()

    const check = async () => {
      try {
        setStatus(await api.updateStatus(controller.signal))
      } catch {
        return
      }
    }

    void check()

    const timer = setInterval(() => void check(), CHECK_MS)

    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [enabled, setStatus])
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useUpdates = () => {
  const [status, setStatus] = useAtom(updateStatusAtom)
  const [job, setJob] = useAtom(updateJobAtom)
  const running = isUpdateRunning(job)

  const waitForRestart = useCallback(
    async (from: string, parked: string | null) => {
      const stalled = (error: string) =>
        setJob((current: UpdateJob) => ({ ...current, phase: "FAILED", error }))

      const downBy = Date.now() + SHUTDOWN_TIMEOUT_MS
      let wentDown = false

      while (Date.now() < downBy && !wentDown) {
        await sleep(HEALTH_POLL_MS)
        wentDown = (await api.health().catch(() => null)) === null
      }

      if (!wentDown) {
        stalled("Loomark never stopped, so the update did not run.")

        return
      }

      const upBy = Date.now() + RESTART_TIMEOUT_MS

      while (Date.now() < upBy) {
        await sleep(HEALTH_POLL_MS)

        const health = await api.health().catch(() => null)

        if (!health) {
          continue
        }

        if (health.version !== from) {
          toast.success(`Updated to ${health.version}. Reloading…`)
          await sleep(1200)
          window.location.reload()

          return
        }

        stalled(
          parked
            ? `The new version would not start, so Loomark rolled back to ${from}. The container is kept as ${parked} so you can inspect it.`
            : `Loomark came back on ${from}, so the update did not take.`
        )

        return
      }

      stalled("The new container did not come back in time. Check docker logs.")
    },
    [setJob]
  )

  const install = useCallback(async () => {
    if (running || !status) {
      return
    }

    try {
      setJob(await api.installUpdate())
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not start the update"
      )

      return
    }

    let restarting = false
    let parked: string | null = null

    while (!restarting) {
      await sleep(JOB_POLL_MS)

      const next = await api.updateJob().catch(() => null)

      if (!next) {
        restarting = true
        break
      }

      setJob(next)
      parked = next.parked ?? parked

      if (next.phase === "FAILED") {
        toast.error(next.error ?? "The update failed")

        return
      }

      if (next.phase === "IDLE") {
        toast.success(next.message || "Already up to date")

        return
      }

      restarting = next.phase === "RESTARTING"
    }

    setJob((current: UpdateJob) => ({
      ...current,
      phase: "RESTARTING",
      progress: 95,
      message: "Restarting into the new version",
    }))

    await waitForRestart(status.current, parked)
  }, [running, status, setJob, waitForRestart])

  const refresh = useCallback(async () => {
    try {
      setStatus(await api.updateStatus())
    } catch {
      return
    }
  }, [setStatus])

  const discardParked = useCallback(async () => {
    try {
      const { discarded } = await api.discardParkedUpdates()

      await refresh()
      toast.success(
        discarded === 1
          ? "Parked container removed"
          : `${discarded} parked containers removed`
      )
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not remove it"
      )
    }
  }, [refresh])

  return { status, job, running, install, refresh, discardParked }
}
