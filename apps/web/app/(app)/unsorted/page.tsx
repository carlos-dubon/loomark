import { redirect } from "next/navigation"

import { DemoUnsorted } from "@/components/demo/demo-unsorted"
import { auth } from "@/lib/auth"
import { isDemo } from "@/lib/demo/config"
import { ensureUnsortedCollection } from "@/lib/collections"

const UnsortedPage = async () => {
  if (isDemo) {
    return <DemoUnsorted />
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  redirect(`/collections/${await ensureUnsortedCollection(session.user.id)}`)
}

export default UnsortedPage
