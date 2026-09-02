import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SharedCollectionView } from "@/components/shared-collection-view"
import { getSharedCollection } from "@/lib/share"

type Props = { params: Promise<{ token: string }> }

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { token } = await params
  const page = await getSharedCollection(token)

  return {
    title: page?.collection.name ?? "Shared collection",
    robots: { index: false, follow: false },
  }
}

const SharedCollectionPage = async ({ params }: Props) => {
  const { token } = await params
  const page = await getSharedCollection(token)

  if (!page) {
    notFound()
  }

  return <SharedCollectionView page={page} />
}

export default SharedCollectionPage
