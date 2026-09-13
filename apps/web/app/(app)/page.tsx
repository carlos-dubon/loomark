import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DemoHome } from "@/components/demo/demo-home"
import { HomeView } from "@/components/views/home-view"
import { auth } from "@/lib/server/auth"
import { isDemo } from "@/lib/demo/config"
import { makeQueryClient } from "@/lib/query-client"
import { LIBRARY_PROBE, PINNED_BOOKMARKS, queryKeys } from "@/lib/query-keys"
import { getBookmarks } from "@/lib/server/queries"

export const metadata: Metadata = { title: "Homepage" }

const HomePage = async () => {
  if (isDemo) {
    return <DemoHome />
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const queryClient = makeQueryClient()

  await Promise.all(
    [PINNED_BOOKMARKS, LIBRARY_PROBE].map((query) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.bookmarkList(query),
        queryFn: () => getBookmarks(userId, query),
      })
    )
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeView />
    </HydrationBoundary>
  )
}

export default HomePage
