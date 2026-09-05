import { CameraIcon, FileTextIcon, GlobeIcon } from "lucide-react"

import type { ArchiveFormat } from "@loomark/core/archive"
import { cn } from "@loomark/core/utils"

const ICONS: Record<ArchiveFormat, typeof CameraIcon> = {
  SCREENSHOT: CameraIcon,
  WEBPAGE: GlobeIcon,
  PDF: FileTextIcon,
  MARKDOWN: FileTextIcon,
}

export const ArchiveFormatIcon = ({
  format,
  className,
}: {
  format: ArchiveFormat
  className?: string
}) => {
  const Icon = ICONS[format]

  return (
    <Icon className={cn("size-4 shrink-0 text-muted-foreground", className)} />
  )
}
