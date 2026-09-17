"use client"

import { useSetAtom } from "jotai"
import { useCallback } from "react"
import { flushSync } from "react-dom"

import { searchDialogAtom } from "@/store/atoms"

const SEARCH_INPUT_SELECTOR =
  "[data-slot='dialog-content'] [data-slot='command-input']"

export const useOpenSearchDialog = () => {
  const setOpen = useSetAtom(searchDialogAtom)

  return useCallback(() => {
    flushSync(() => setOpen(true))

    document
      .querySelector<HTMLInputElement>(SEARCH_INPUT_SELECTOR)
      ?.focus({ preventScroll: true })
  }, [setOpen])
}
