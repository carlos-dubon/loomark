import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()

  if (session?.user?.id) {
    redirect("/")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <div className="flex flex-col items-center gap-1">
        <span className="text-4xl leading-none">🗃️</span>
        <span className="text-sm text-muted-foreground">
          Loomark — your bookmark library
        </span>
      </div>
      {children}
    </div>
  )
}

export default AuthLayout
