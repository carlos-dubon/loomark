import { cookies } from "next/headers"
import { redirect } from "next/navigation"

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
import { DndProvider } from "@/components/dnd-provider"
import { getUserRole } from "@/lib/admin"
import { getAppearance } from "@/lib/appearance"
import { auth } from "@/lib/auth"
import { ensureUnsortedCollection } from "@/lib/collections"
import { NEW_TAB_COOKIE_NAME, toOpenInNewTab } from "@/lib/open-target"
import { getCollections } from "@/lib/queries"
import { THEME_PRESETS } from "@/lib/themes/presets"
import { findPreset, fontStylesheetFor, presetToCss } from "@/lib/themes/theme"

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const role = await getUserRole(session.user.id)

  if (!role) {
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
      openInNewTab={toOpenInNewTab(cookieStore.get(NEW_TAB_COOKIE_NAME)?.value)}
    >
      <SidebarProvider
        className="h-svh overflow-hidden"
        defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}
      >
        <DndProvider>
          <AppSidebar
            collections={collections}
            isOwner={role === "OWNER"}
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
        <CollectionShareDialog />
        <ArchiveDialog />
      </SidebarProvider>
    </AppearanceProvider>
  )
}

export default AppLayout
