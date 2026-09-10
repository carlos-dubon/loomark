import { redirect } from "next/navigation"

import { LoomarkMark } from "@/components/loomark-mark"
import { getUserRole } from "@/lib/server/admin"
import { auth } from "@/lib/server/auth"
import { isDemo } from "@/lib/demo/config"

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = isDemo ? null : await auth()

  if (session?.user?.id) {
    const role = await getUserRole(session.user.id)

    if (role) {
      redirect("/")
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <LoomarkMark className="size-12" />
      {children}
    </div>
  )
}

export default AuthLayout
