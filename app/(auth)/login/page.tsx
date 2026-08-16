import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Sign in · tana" }

const LoginPage = () => <LoginForm />

export default LoginPage
