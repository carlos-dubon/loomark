import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DemoHome } from "@/components/demo/demo-home"
import { HomeView } from "@/components/home-view"
import { auth } from "@/lib/auth"
import { isDemo } from "@/lib/demo/config"
import { prisma } from "@/lib/prisma"
import { getBookmarks } from "@/lib/queries"

export const metadata: Metadata = { title: "Homepage" }

const HomePage = async () => {
  if (isDemo) {
    return <DemoHome />
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [pinned, bookmarkCount] = await Promise.all([
    getBookmarks(session.user.id, {
      pinned: true,
      take: 120,
    }),
    prisma.bookmark.count({ where: { userId: session.user.id } }),
  ])

  return <HomeView pinned={pinned} bookmarkCount={bookmarkCount} />
}

export default HomePage
