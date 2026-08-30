import type { LucideIcon } from "lucide-react"

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) => (
  <div className="mx-auto flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center sm:max-w-2xl">
    <Icon className="size-6 text-muted-foreground" />
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
    {action}
  </div>
)
