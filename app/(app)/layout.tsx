import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { BookmarkDialog } from "@/components/bookmark-dialog"
import { CollectionDialog } from "@/components/collection-dialog"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { ensureUnsortedCollection } from "@/lib/collections"
import { getCollections } from "@/lib/queries"

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  await ensureUnsortedCollection(session.user.id)

  const [collections, cookieStore] = await Promise.all([
    getCollections(session.user.id),
    cookies(),
  ])

  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}
    >
      <AppSidebar
        collections={collections}
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? "",
          image: session.user.image ?? null,
        }}
      />
      <SidebarInset>{children}</SidebarInset>
      <BookmarkDialog />
      <CollectionDialog />
    </SidebarProvider>
  )
}

export default AppLayout
