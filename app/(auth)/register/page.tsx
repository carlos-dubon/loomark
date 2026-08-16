import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = { title: "Create account · tana" }

const RegisterPage = () => <RegisterForm />

export default RegisterPage
