import type { Release } from "@loomark/core/updates"

const REPO = "carlos-dubon/loomark"
const ENDPOINT = `https://api.github.com/repos/${REPO}/releases/latest`
const TTL_MS = 600_000
const RETRY_MS = 300_000
const NOTES_LIMIT = 4000

type GithubRelease = {
  tag_name?: string
  html_url?: string
  body?: string | null
  published_at?: string | null
  draft?: boolean
  prerelease?: boolean
}

let cached: {
  release: Release | null
  at: number
  failed: boolean
} | null = null
let inflight: Promise<Release | null> | null = null

const load = async (): Promise<Release | null> => {
  const response = await fetch(ENDPOINT, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)

  if (!response?.ok) {
    return null
  }

  const release = (await response
    .json()
    .catch(() => null)) as GithubRelease | null

  if (!release?.tag_name || release.draft || release.prerelease) {
    return null
  }

  return {
    version: release.tag_name.replace(/^v/, ""),
    url: release.html_url ?? `https://github.com/${REPO}/releases`,
    notes: release.body?.trim().slice(0, NOTES_LIMIT) || null,
    publishedAt: release.published_at ?? new Date().toISOString(),
  }
}

export const fetchLatestRelease = async ({
  force = false,
}: { force?: boolean } = {}): Promise<Release | null> => {
  const ttl = cached && !cached.failed ? TTL_MS : RETRY_MS

  if (!force && cached && Date.now() - cached.at < ttl) {
    return cached.release
  }

  inflight ??= load()
    .then((release) => {
      cached = {
        release: release ?? cached?.release ?? null,
        at: Date.now(),
        failed: release === null,
      }

      return cached.release
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}
