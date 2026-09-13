import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SidebarInset, SidebarProvider } from "@loomark/ui/components/sidebar"

import { AppSidebar } from "@/components/app-sidebar"
import { AppearanceProvider } from "@/components/appearance-provider"
import { BookmarkDeleteDialog } from "@/components/bookmark-delete-dialog"
import { BookmarkDialog } from "@/components/bookmark-dialog"
import { BookmarkSearchDialog } from "@/components/bookmark-search-dialog"
import { BookmarkSelectionBar } from "@/components/bookmark-selection-bar"
import { CollectionDeleteDialog } from "@/components/collection-delete-dialog"
import { CollectionDialog } from "@/components/collection-dialog"
import { DemoShell } from "@/components/demo/demo-shell"
import { DndProvider } from "@/components/dnd-provider"
import { UpdateToast } from "@/components/update-toast"
import { getAppearance } from "@/lib/server/appearance"
import { isDemo } from "@/lib/demo/config"
import { auth } from "@/lib/server/auth"
import { ensureUnsortedCollection } from "@/lib/server/collections"
import { NEW_TAB_COOKIE_NAME, toOpenInNewTab } from "@/lib/open-target"
import { makeQueryClient } from "@/lib/query-client"
import { queryKeys } from "@/lib/query-keys"
import { getCollections, getProfile } from "@/lib/server/queries"

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

  const userId = session.user.id
  const queryClient = makeQueryClient()

  const [cookieStore] = await Promise.all([
    cookies(),
    queryClient.prefetchQuery({
      queryKey: queryKeys.collections,
      queryFn: () => getCollections(userId),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.appearance,
      queryFn: () => getAppearance(userId),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppearanceProvider
        openInNewTab={toOpenInNewTab(
          cookieStore.get(NEW_TAB_COOKIE_NAME)?.value
        )}
      >
        <SidebarProvider
          className="h-svh overflow-hidden"
          defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}
        >
          <DndProvider>
            <AppSidebar
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
          <UpdateToast isOwner={profile.role === "OWNER"} />
        </SidebarProvider>
      </AppearanceProvider>
    </HydrationBoundary>
  )
}

export default AppLayout
