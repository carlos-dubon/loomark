import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { RegisterForm } from "@/components/auth/register-form"
import { isDemo } from "@/lib/demo/config"

export const metadata: Metadata = { title: "Create account" }

const RegisterPage = () => {
  if (isDemo) {
    redirect("/login")
  }

  return <RegisterForm />
}

export default RegisterPage
