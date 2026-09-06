"use client"

import { useAtomValue } from "jotai"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { useUpdateWatcher } from "@/hooks/use-updates"
import { updateStatusAtom } from "@/store/atoms"

const SEEN_KEY = "loomark:update-seen"

const alreadySeen = (version: string) => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === version
  } catch {
    return false
  }
}

const remember = (version: string) => {
  try {
    window.localStorage.setItem(SEEN_KEY, version)
  } catch {
    return
  }
}

export const UpdateToast = ({ isOwner }: { isOwner: boolean }) => {
  useUpdateWatcher(isOwner)

  const status = useAtomValue(updateStatusAtom)
  const router = useRouter()
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current || !status?.available || !status.latest) {
      return
    }

    const { version } = status.latest

    if (alreadySeen(version)) {
      return
    }

    shown.current = true
    remember(version)

    toast(`Loomark ${version} is available`, {
      description: `You are running ${status.current}.`,
      duration: 12000,
      action: {
        label: "See what is new",
        onClick: () => router.push("/settings"),
      },
    })
  }, [status, router])

  return null
}
