"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { SidebarInset, SidebarProvider } from "@loomark/ui/components/sidebar"

import { AppSidebar } from "@/components/app-sidebar"
import { AppearanceProvider } from "@/components/appearance-provider"
import { ArchiveDialog } from "@/components/archive-dialog"
import { BookmarkDeleteDialog } from "@/components/bookmark-delete-dialog"
import { BookmarkDialog } from "@/components/bookmark-dialog"
import { BookmarkSearchDialog } from "@/components/bookmark-search-dialog"
import { BookmarkSelectionBar } from "@/components/bookmark-selection-bar"
import { CollectionDeleteDialog } from "@/components/collection-delete-dialog"
import { CollectionDialog } from "@/components/collection-dialog"
import { CollectionShareDialog } from "@/components/collection-share-dialog"
import { DemoNotice } from "@/components/demo/demo-notice"
import { DndProvider } from "@/components/dnd-provider"
import { useDemoState, useMounted } from "@/hooks/use-demo-state"
import { collectionList } from "@/lib/demo/store"
import { THEMES } from "@/lib/themes/palettes"
import { findTheme, themeToCss } from "@/lib/themes/theme"

export const DemoShell = ({ children }: { children: React.ReactNode }) => {
  const state = useDemoState()
  const mounted = useMounted()
  const router = useRouter()

  useEffect(() => {
    if (mounted && !state.signedIn) {
      router.replace("/login")
    }
  }, [mounted, state.signedIn, router])

  if (!mounted || !state.signedIn) {
    return null
  }

  return (
    <AppearanceProvider
      appearance={state.appearance}
      themeCss={themeToCss(findTheme(THEMES, state.appearance.themeId))}
      openInNewTab
    >
      <SidebarProvider className="h-svh overflow-hidden" defaultOpen>
        <DndProvider>
          <AppSidebar
            collections={collectionList(state)}
            isOwner={false}
            user={state.user}
          />
          <SidebarInset>
            <DemoNotice />
            {children}
          </SidebarInset>
        </DndProvider>
        <BookmarkDialog />
        <BookmarkSearchDialog />
        <CollectionDialog />
        <BookmarkSelectionBar />
        <BookmarkDeleteDialog />
        <CollectionDeleteDialog />
        <CollectionShareDialog />
        <ArchiveDialog />
      </SidebarProvider>
    </AppearanceProvider>
  )
}
