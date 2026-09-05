import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DemoTransfer } from "@/components/demo/demo-transfer"
import { TransferView } from "@/components/settings/transfer-view"
import { auth } from "@/lib/auth"
import { isDemo } from "@/lib/demo/config"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Import and export" }

const TransferPage = async () => {
  if (isDemo) {
    return <DemoTransfer />
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [bookmarkCount, collectionCount] = await Promise.all([
    prisma.bookmark.count({ where: { userId: session.user.id } }),
    prisma.collection.count({ where: { userId: session.user.id } }),
  ])

  return (
    <TransferView
      bookmarkCount={bookmarkCount}
      collectionCount={collectionCount}
    />
  )
}

export default TransferPage
