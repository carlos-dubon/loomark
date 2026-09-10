"use client"

import { useSyncExternalStore } from "react"

import { getState, subscribe } from "@/lib/client/demo/store"

const noop = () => () => {}

export const useDemoState = () =>
  useSyncExternalStore(subscribe, getState, getState)

export const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
