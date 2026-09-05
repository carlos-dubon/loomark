import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"
import { DemoLoginForm } from "@/components/demo/demo-login-form"
import { isDemo } from "@/lib/demo/config"

export const metadata: Metadata = { title: "Sign in" }

type Props = { searchParams: Promise<{ callbackUrl?: string }> }

const LoginPage = async ({ searchParams }: Props) => {
  if (isDemo) {
    return <DemoLoginForm />
  }

  const { callbackUrl } = await searchParams

  return <LoginForm callbackUrl={callbackUrl} />
}

export default LoginPage
