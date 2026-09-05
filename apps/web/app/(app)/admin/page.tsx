import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminView } from "@/components/admin-view"
import { getInstanceUsers, requireOwnerId } from "@/lib/admin"
import { isDemo } from "@/lib/demo/config"

export const metadata: Metadata = { title: "Server administration" }

const AdminPage = async () => {
  if (isDemo) {
    redirect("/settings")
  }

  const ownerId = await requireOwnerId()

  if (!ownerId) {
    redirect("/")
  }

  return <AdminView ownerId={ownerId} users={await getInstanceUsers()} />
}

export default AdminPage
