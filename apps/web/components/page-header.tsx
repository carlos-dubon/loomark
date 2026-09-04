import { PanelLeftIcon } from "lucide-react"

import { SidebarTrigger } from "@loomark/ui/components/sidebar"

export const PageHeader = ({
  title,
  description,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
}) => (
  <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 bg-background/80 px-4 backdrop-blur md:px-6">
    <div className="flex min-w-0 flex-1 flex-col">
      <h1 className="truncate text-sm font-semibold">{title}</h1>
      {description ? (
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      {children}
      <SidebarTrigger className="-mr-1">
        <PanelLeftIcon />
      </SidebarTrigger>
    </div>
  </header>
)
