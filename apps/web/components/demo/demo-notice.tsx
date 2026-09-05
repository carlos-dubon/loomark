"use client"

import { DatabaseZapIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@loomark/ui/components/button"

import { signOut } from "@/lib/demo/store"

export const DemoNotice = () => (
  <div className="flex shrink-0 items-center gap-2.5 border-b border-warning/32 bg-warning-surface px-4 py-2 text-xs text-warning-foreground md:px-6">
    <DatabaseZapIcon className="size-3.5 shrink-0 text-warning" />
    <p className="min-w-0 flex-1 text-current/80">
      <span className="font-medium text-current">Demo mode.</span> Everything
      here lives in an in-memory database inside this tab — edit, drag, delete
      and archive whatever you like. Refreshing the page wipes it all and starts
      over.
    </p>
    <Button
      variant="ghost"
      size="compact"
      className="shrink-0 text-current hover:bg-warning/8 hover:text-current"
      onClick={() => {
        signOut()
        window.location.reload()
      }}
    >
      <RotateCcwIcon />
      <span className="hidden sm:inline">Reset demo</span>
    </Button>
  </div>
)
