import type { Release } from "@loomark/core/updates"

const REPO = "carlos-dubon/loomark"
const ENDPOINT = `https://api.github.com/repos/${REPO}/releases/latest`
const TTL_MS = 3_600_000
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

let cached: { release: Release | null; at: number } | null = null
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

export const fetchLatestRelease = async (): Promise<Release | null> => {
  const ttl = cached?.release ? TTL_MS : RETRY_MS

  if (cached && Date.now() - cached.at < ttl) {
    return cached.release
  }

  inflight ??= load()
    .then((release) => {
      cached = { release, at: Date.now() }

      return release
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}
