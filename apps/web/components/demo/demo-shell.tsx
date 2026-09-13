"use client"

import { HydrationBoundary } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"

import { SidebarInset, SidebarProvider } from "@loomark/ui/components/sidebar"

import { AppSidebar } from "@/components/app-sidebar"
import { AppearanceProvider } from "@/components/appearance-provider"
import { BookmarkDeleteDialog } from "@/components/bookmark-delete-dialog"
import { BookmarkDialog } from "@/components/bookmark-dialog"
import { BookmarkSearchDialog } from "@/components/bookmark-search-dialog"
import { BookmarkSelectionBar } from "@/components/bookmark-selection-bar"
import { CollectionDeleteDialog } from "@/components/collection-delete-dialog"
import { CollectionDialog } from "@/components/collection-dialog"
import { DndProvider } from "@/components/dnd-provider"
import { useDemoState, useMounted } from "@/hooks/use-demo-state"
import { seedWorkspace } from "@/lib/client/demo/queries"
import { getState } from "@/lib/client/demo/store"

export const DemoShell = ({ children }: { children: React.ReactNode }) => {
  const state = useDemoState()
  const mounted = useMounted()
  const router = useRouter()

  const seed = useMemo(
    () => (mounted && state.signedIn ? seedWorkspace(getState()) : null),
    [mounted, state.signedIn]
  )

  useEffect(() => {
    if (mounted && !state.signedIn) {
      router.replace("/login")
    }
  }, [mounted, state.signedIn, router])

  if (!seed) {
    return null
  }

  return (
    <HydrationBoundary state={seed}>
      <AppearanceProvider openInNewTab>
        <SidebarProvider className="h-svh overflow-hidden" defaultOpen>
          <DndProvider>
            <AppSidebar isOwner={false} user={state.user} />
            <SidebarInset>{children}</SidebarInset>
          </DndProvider>
          <BookmarkDialog />
          <BookmarkSearchDialog />
          <CollectionDialog />
          <BookmarkSelectionBar />
          <BookmarkDeleteDialog />
          <CollectionDeleteDialog />
        </SidebarProvider>
      </AppearanceProvider>
    </HydrationBoundary>
  )
}
