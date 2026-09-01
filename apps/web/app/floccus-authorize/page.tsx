import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { FloccusAuthorizeCard } from "@/components/floccus-authorize-card"
import { auth } from "@/lib/auth"

export const metadata: Metadata = { title: "Connect floccus" }

type Props = { searchParams: Promise<{ token?: string }> }

const FloccusAuthorizePage = async ({ searchParams }: Props) => {
  const { token } = await searchParams
  const session = await auth()

  if (!session?.user?.id) {
    const callback = `/floccus-authorize${token ? `?token=${encodeURIComponent(token)}` : ""}`
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`)
  }

  return (
    <FloccusAuthorizeCard
      token={token ?? null}
      email={session.user.email ?? ""}
    />
  )
}

export default FloccusAuthorizePage
