import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AppearanceProvider } from "@/components/appearance-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { BookmarkDeleteDialog } from "@/components/bookmark-delete-dialog"
import { BookmarkDialog } from "@/components/bookmark-dialog"
import { BookmarkSearchDialog } from "@/components/bookmark-search-dialog"
import { BookmarkSelectionBar } from "@/components/bookmark-selection-bar"
import { CollectionDeleteDialog } from "@/components/collection-delete-dialog"
import { CollectionDialog } from "@/components/collection-dialog"
import { DndProvider } from "@/components/dnd-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getAppearance } from "@/lib/appearance"
import { auth } from "@/lib/auth"
import { ensureUnsortedCollection } from "@/lib/collections"
import { getCollections } from "@/lib/queries"
import { THEME_PRESETS } from "@/lib/themes/presets"
import { findPreset, fontStylesheetFor, presetToCss } from "@/lib/themes/theme"

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  await ensureUnsortedCollection(session.user.id)

  const [collections, cookieStore, appearance] = await Promise.all([
    getCollections(session.user.id),
    cookies(),
    getAppearance(session.user.id),
  ])

  const preset = findPreset(THEME_PRESETS, appearance.themePreset)

  return (
    <AppearanceProvider
      appearance={appearance}
      themeCss={presetToCss(preset)}
      fontHref={fontStylesheetFor(preset)}
    >
      <SidebarProvider
        className="h-svh overflow-hidden"
        defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}
      >
        <DndProvider>
          <AppSidebar
            collections={collections}
            user={{
              name: session.user.name ?? null,
              email: session.user.email ?? "",
              image: session.user.image ?? null,
            }}
          />
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
  )
}

export default AppLayout
