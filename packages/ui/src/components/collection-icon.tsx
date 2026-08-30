"use client"

import { FolderIcon } from "lucide-react"
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic"
import { useCallback } from "react"

const KNOWN_ICONS = new Set<string>(iconNames)

export const isIconName = (value: unknown): value is IconName =>
  typeof value === "string" && KNOWN_ICONS.has(value)

export const CollectionIcon = ({
  name,
  className,
}: {
  name: string | null | undefined
  className?: string
}) => {
  const fallback = useCallback(
    () => <FolderIcon className={className} />,
    [className]
  )

  return isIconName(name) ? (
    <DynamicIcon name={name} className={className} fallback={fallback} />
  ) : (
    <FolderIcon className={className} />
  )
}
