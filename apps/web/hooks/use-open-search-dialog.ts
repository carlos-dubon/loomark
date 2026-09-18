"use client"

import { useSetAtom } from "jotai"
import { useCallback } from "react"

import { searchDialogAtom } from "@/store/atoms"

const COARSE_POINTER = "(pointer: coarse)"
const KEYBOARD_PROXY_TIMEOUT_MS = 1000

const primeVirtualKeyboard = () => {
  const proxy = document.createElement("input")
  proxy.tabIndex = -1
  proxy.setAttribute("aria-hidden", "true")
  proxy.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;pointer-events:none"

  const remove = () => proxy.remove()

  proxy.addEventListener("blur", remove, { once: true })
  document.body.append(proxy)
  proxy.focus({ preventScroll: true })
  setTimeout(remove, KEYBOARD_PROXY_TIMEOUT_MS)
}

export const useOpenSearchDialog = () => {
  const setOpen = useSetAtom(searchDialogAtom)

  return useCallback(() => {
    if (window.matchMedia(COARSE_POINTER).matches) {
      primeVirtualKeyboard()
    }

    setOpen(true)
  }, [setOpen])
}
