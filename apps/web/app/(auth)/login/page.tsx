import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Sign in" }

type Props = { searchParams: Promise<{ callbackUrl?: string }> }

const LoginPage = async ({ searchParams }: Props) => {
  const { callbackUrl } = await searchParams

  return <LoginForm callbackUrl={callbackUrl} />
}

export default LoginPage
