"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { Button } from "@loomark/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@loomark/ui/components/card"
import { Field } from "@loomark/ui/components/field"
import { Input } from "@loomark/ui/components/input"

import { Link } from "@/components/link"
import { loginSchema } from "@/lib/schemas"

type Props = { callbackUrl?: string }

export const LoginForm = ({ callbackUrl }: Props) => {
  const router = useRouter()
  const destination =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/"

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    })

    if (result?.error) {
      setError("root", { message: "Invalid email or password" })
      return
    }

    router.replace(destination)
    router.refresh()
  })

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to reach your library.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-4">
          <Field
            label="Email"
            htmlFor="email"
            error={errors.email ? "Enter a valid email" : undefined}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </Field>
          <Field
            label="Password"
            htmlFor="password"
            error={errors.password ? "Enter your password" : undefined}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
          </Field>
          {errors.root ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="mt-4 flex-col items-stretch gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account yet?{" "}
            <Link href="/register" className="text-foreground underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
