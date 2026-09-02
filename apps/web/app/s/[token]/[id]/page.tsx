import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SharedCollectionView } from "@/components/shared-collection-view"
import { getSharedCollection } from "@/lib/share"

type Props = { params: Promise<{ token: string; id: string }> }

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { token, id } = await params
  const page = await getSharedCollection(token, id)

  return {
    title: page?.collection.name ?? "Shared collection",
    robots: { index: false, follow: false },
  }
}

const SharedSubcollectionPage = async ({ params }: Props) => {
  const { token, id } = await params
  const page = await getSharedCollection(token, id)

  if (!page) {
    notFound()
  }

  return <SharedCollectionView page={page} />
}

export default SharedSubcollectionPage
