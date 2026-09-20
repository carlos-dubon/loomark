"use client"

import { useSetAtom } from "jotai"
import { useCallback } from "react"
import { flushSync } from "react-dom"

import { searchDialogAtom } from "@/store/atoms"

export const useOpenSearchDialog = () => {
  const setOpen = useSetAtom(searchDialogAtom)

  return useCallback(() => {
    flushSync(() => setOpen(true))
    document
      .querySelector<HTMLInputElement>("[data-bookmark-search-input]")
      ?.focus({ preventScroll: true })
  }, [setOpen])
}
