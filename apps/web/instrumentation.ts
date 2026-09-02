export const register = async () => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  const { startArchiveWorker } = await import("@/lib/archives/worker")

  startArchiveWorker()
}
