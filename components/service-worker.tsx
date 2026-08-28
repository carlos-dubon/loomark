"use client"

import { useEffect } from "react"

export const ServiceWorker = () => {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return
    }

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" })
    }

    if (document.readyState === "complete") {
      register()
      return
    }

    window.addEventListener("load", register)

    return () => window.removeEventListener("load", register)
  }, [])

  return null
}
