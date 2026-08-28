import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = { title: "Create account · Loomark" }

const RegisterPage = () => <RegisterForm />

export default RegisterPage
