import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@loomark/ui/components/button"

export const PanelHeader = ({
  title,
  description,
  backLabel = "Back",
  onBack,
}: {
  title: string
  description?: string
  backLabel?: string
  onBack: () => void
}) => (
  <div className="flex items-center gap-1">
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={backLabel}
      onClick={onBack}
    >
      <ArrowLeftIcon />
    </Button>
    <div className="flex min-w-0 flex-col">
      <h1 className="text-sm font-medium">{title}</h1>
      {description ? (
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  </div>
)
