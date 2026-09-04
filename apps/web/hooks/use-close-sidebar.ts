"use client"

import { useCallback } from "react"

import { useSidebar } from "@loomark/ui/components/sidebar"

export const useCloseSidebar = () => {
  const { isMobile, setOpenMobile } = useSidebar()

  return useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])
}
