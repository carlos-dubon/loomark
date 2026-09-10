import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { BookmarkListView } from "@/components/bookmark-list-view"
import { DemoCollection } from "@/components/demo/demo-collection"
import { auth } from "@/lib/server/auth"
import { collectionEmptyState } from "@/lib/collection-view"
import { isDemo } from "@/lib/demo/config"
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

  const bookmarks = await getBookmarks(session.user.id, {
    collectionId: id,
    take: 200,
  })

  return (
    <BookmarkListView
      title={collection.name}
      collectionId={collection.id}
      collection={collection}
      bookmarks={bookmarks}
      {...collectionEmptyState(collection)}
    />
  )
}

export default CollectionPage
