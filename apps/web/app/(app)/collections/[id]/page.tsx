import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { BookmarkListView } from "@/components/views/bookmark-list-view"
import { DemoCollection } from "@/components/demo/demo-collection"
import { auth } from "@/lib/server/auth"
import { isDemo } from "@/lib/demo/config"
import { makeQueryClient } from "@/lib/query-client"
import { collectionBookmarks, queryKeys } from "@/lib/query-keys"
import { getBookmarks, getCollection } from "@/lib/server/queries"

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> => {
  if (isDemo) {
    return { title: "Collection" }
  }

  const session = await auth()

  if (!session?.user?.id) {
    return {}
  }

  const { id } = await params
  const collection = await getCollection(session.user.id, id)

  return { title: collection?.name ?? "Collection" }
}

const CollectionPage = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
  if (isDemo) {
    return <DemoCollection id={(await params).id} />
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const collection = await getCollection(session.user.id, id)

  if (!collection) {
    notFound()
  }

  const userId = session.user.id
  const query = collectionBookmarks(collection.id)
  const queryClient = makeQueryClient()

  await queryClient.prefetchQuery({
    queryKey: queryKeys.bookmarkList(query),
    queryFn: () => getBookmarks(userId, query),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookmarkListView collectionId={collection.id} />
    </HydrationBoundary>
  )
}

export default CollectionPage
