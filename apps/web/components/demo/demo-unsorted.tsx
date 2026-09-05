"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useDemoState } from "@/hooks/use-demo-state"
import { unsortedId } from "@/lib/demo/store"

export const DemoUnsorted = () => {
  const state = useDemoState()
  const router = useRouter()
  const id = unsortedId(state)

  useEffect(() => {
    router.replace(`/collections/${id}`)
  }, [id, router])

  return null
}
