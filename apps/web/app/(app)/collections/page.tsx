import type { Metadata } from "next"

import { CollectionsView } from "@/components/views/collections-view"

export const metadata: Metadata = { title: "Collections" }

const CollectionsPage = () => <CollectionsView />

export default CollectionsPage
