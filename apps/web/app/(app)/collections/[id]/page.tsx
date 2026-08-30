import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { BookmarkListView } from "@/components/bookmark-list-view"
import { auth } from "@/lib/auth"
import { getBookmarks, getChildCollections, getCollection } from "@/lib/queries"

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> => {
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
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const collection = await getCollection(session.user.id, id)

  if (!collection) {
    notFound()
  }

  const unsorted = collection.kind === "UNSORTED"

  const [bookmarks, subcollections] = await Promise.all([
    getBookmarks(session.user.id, {
      collectionId: id,
      take: 200,
    }),
    unsorted ? Promise.resolve([]) : getChildCollections(session.user.id, id),
  ])

  return (
    <BookmarkListView
      title={collection.name}
      collectionId={collection.id}
      collection={collection}
      bookmarks={bookmarks}
      subcollections={subcollections}
      emptyIcon={unsorted ? "inbox" : "bookmark"}
      emptyTitle={unsorted ? "Nothing unsorted" : "This collection is empty"}
      emptyDescription={
        unsorted
          ? "Every bookmark you saved already lives in a collection."
          : "Add a bookmark here or drop one in from another collection."
      }
    />
  )
}

export default CollectionPage
