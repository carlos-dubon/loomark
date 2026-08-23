import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { ensureUnsortedCollection } from "@/lib/collections"

const UnsortedPage = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  redirect(`/collections/${await ensureUnsortedCollection(session.user.id)}`)
}

export default UnsortedPage
