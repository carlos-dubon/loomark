"use client"

import { useAtom } from "jotai"

import { useAppearanceSetting } from "@/hooks/use-appearance-setting"
import { gridColumnsPreviewAtom } from "@/store/atoms"

export const useGridColumns = () => {
  const [saved, select] = useAppearanceSetting(
    "gridColumns",
    "Could not save columns"
  )
  const [preview, setPreview] = useAtom(gridColumnsPreviewAtom)

  return { columns: preview ?? saved, select, setPreview }
}
