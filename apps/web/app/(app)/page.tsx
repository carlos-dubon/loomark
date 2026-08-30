import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { HomeView } from "@/components/home-view"
import { auth } from "@/lib/auth"
import { getBookmarks } from "@/lib/queries"

export const metadata: Metadata = { title: "Homepage" }

const HomePage = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const pinned = await getBookmarks(session.user.id, {
    pinned: true,
    take: 120,
  })

  return <HomeView pinned={pinned} />
}

export default HomePage
