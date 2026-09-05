export const register = async () => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  if (process.env.NEXT_PUBLIC_DEMO === "true") {
    return
  }

  const { startArchiveWorker } = await import("@/lib/archives/worker")

  startArchiveWorker()
}
