"use client"

import { useAtom } from "jotai"

import { NEW_TAB_COOKIE_MAX_AGE, NEW_TAB_COOKIE_NAME } from "@/lib/open-target"
import { openInNewTabAtom } from "@/store/atoms"

export const useOpenInNewTab = () => {
  const [newTab, setNewTab] = useAtom(openInNewTabAtom)

  const select = (next: boolean) => {
    setNewTab(next)
    document.cookie = `${NEW_TAB_COOKIE_NAME}=${next}; path=/; max-age=${NEW_TAB_COOKIE_MAX_AGE}; samesite=lax`
  }

  const open = (url: string) => {
    if (newTab) {
      window.open(url, "_blank", "noopener,noreferrer")
      return
    }

    window.location.assign(url)
  }

  return { newTab, select, open }
}
