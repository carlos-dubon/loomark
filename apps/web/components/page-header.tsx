"use client"

import { useAtomValue } from "jotai"
import { PanelLeftIcon, PanelRightIcon } from "lucide-react"

import { Separator } from "@loomark/ui/components/separator"
import { SidebarTrigger } from "@loomark/ui/components/sidebar"

import { sidebarSideAtom } from "@/store/atoms"

export const PageHeader = ({
  title,
  description,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
}) => {
  const side = useAtomValue(sidebarSideAtom)

  const toggle = (
    <>
      <SidebarTrigger className={side === "left" ? "-ml-1" : "-mr-1"}>
        {side === "left" ? <PanelLeftIcon /> : <PanelRightIcon />}
      </SidebarTrigger>
      <Separator orientation="vertical" className="h-4 self-center" />
    </>
  )

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      {side === "left" ? toggle : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-sm font-semibold">{title}</h1>
        {description ? (
          <p className="truncate text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {children}
      </div>
      {side === "right" ? (
        <div className="flex shrink-0 flex-row-reverse items-center gap-2">
          {toggle}
        </div>
      ) : null}
    </header>
  )
}
