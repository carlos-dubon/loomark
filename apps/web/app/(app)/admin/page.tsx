import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminView } from "@/components/admin-view"
import { getInstanceUsers, requireOwnerId } from "@/lib/admin"

export const metadata: Metadata = { title: "Server administration" }

const AdminPage = async () => {
  const ownerId = await requireOwnerId()

  if (!ownerId) {
    redirect("/")
  }

  return <AdminView ownerId={ownerId} users={await getInstanceUsers()} />
}

export default AdminPage
