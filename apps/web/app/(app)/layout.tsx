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
import { DemoShell } from "@/components/demo/demo-shell"
import { DndProvider } from "@/components/dnd-provider"
import { getAppearance } from "@/lib/appearance"
import { isDemo } from "@/lib/demo/config"
import { auth } from "@/lib/auth"
import { ensureUnsortedCollection } from "@/lib/collections"
import { NEW_TAB_COOKIE_NAME, toOpenInNewTab } from "@/lib/open-target"
import { getCollections, getProfile } from "@/lib/queries"
import { THEMES } from "@/lib/themes/palettes"
import { findTheme, themeToCss } from "@/lib/themes/theme"

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  if (isDemo) {
    return <DemoShell>{children}</DemoShell>
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const profile = await getProfile(session.user.id)

  if (!profile) {
    redirect("/login")
  }

  await ensureUnsortedCollection(session.user.id)

  const [collections, cookieStore, appearance] = await Promise.all([
    getCollections(session.user.id),
    cookies(),
    getAppearance(session.user.id),
  ])

  return (
    <AppearanceProvider
      appearance={appearance}
      themeCss={themeToCss(findTheme(THEMES, appearance.themeId))}
      openInNewTab={toOpenInNewTab(cookieStore.get(NEW_TAB_COOKIE_NAME)?.value)}
    >
      <SidebarProvider
        className="h-svh overflow-hidden"
        defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}
      >
        <DndProvider>
          <AppSidebar
            collections={collections}
            isOwner={profile.role === "OWNER"}
            user={{
              name: profile.name,
              email: profile.email,
              image: profile.image,
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
