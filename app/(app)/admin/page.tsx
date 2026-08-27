import { redirect } from "next/navigation"

import { AdminView } from "@/components/admin-view"
import { getInstanceUsers, requireOwnerId } from "@/lib/admin"

const AdminPage = async () => {
  const ownerId = await requireOwnerId()

  if (!ownerId) {
    redirect("/")
  }

  return <AdminView ownerId={ownerId} users={await getInstanceUsers()} />
}

export default AdminPage
