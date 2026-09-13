"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { useCallback } from "react"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import { isUpdateRunning, type UpdateJob } from "@loomark/core/updates"

import { api } from "@/lib/client/api"
import { updateStatusQuery } from "@/lib/client/queries"
import { isDemo } from "@/lib/demo/config"
import { updateJobAtom } from "@/store/atoms"

const JOB_POLL_MS = 1000
const HEALTH_POLL_MS = 2000
const SHUTDOWN_TIMEOUT_MS = 120_000
const RESTART_TIMEOUT_MS = 600_000

export const useUpdateStatus = (enabled: boolean) =>
  useQuery({ ...updateStatusQuery, enabled: enabled && !isDemo }).data ?? null

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useUpdates = () => {
  const queryClient = useQueryClient()
  const status = useUpdateStatus(true)
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

  const installation = useMutation({
    mutationFn: async (from: string) => {
      setJob(await api.installUpdate())

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

      await waitForRestart(from, parked)
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Could not start the update"))
    },
  })

  const install = () => {
    if (running || !status || installation.isPending) {
      return
    }

    installation.mutate(status.current)
  }

  const check = useMutation({
    mutationFn: () => api.updateStatus({ force: true }),
    onSuccess: (next) => {
      queryClient.setQueryData(updateStatusQuery.queryKey, next)
    },
  })

  const discard = useMutation({
    mutationFn: () => api.discardParkedUpdates(),
    onSuccess: async ({ discarded }) => {
      await queryClient.invalidateQueries({
        queryKey: updateStatusQuery.queryKey,
      })
      toast.success(
        discarded === 1
          ? "Parked container removed"
          : `${discarded} parked containers removed`
      )
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Could not remove it"))
    },
  })

  return {
    status,
    job,
    running,
    install,
    installing: installation.isPending,
    check: () => check.mutate(),
    checking: check.isPending,
    discardParked: () => discard.mutate(),
    discarding: discard.isPending,
  }
}
