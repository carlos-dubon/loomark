"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { errorMessage } from "@loomark/core/format"
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
import { api } from "@/lib/client/api"
import { registerSchema } from "@/lib/schemas"

export const RegisterForm = () => {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.register(values)
      await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })
      router.replace("/")
      router.refresh()
    } catch (cause) {
      setError("root", {
        message: errorMessage(cause, "Registration failed"),
      })
    }
  })

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Save your bookmarks and access them from anywhere.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-4">
          <Field
            label="Name"
            htmlFor="name"
            error={errors.name ? "Tell us what to call you" : undefined}
          >
            <Input
              id="name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </Field>
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
            error={errors.password ? "Use at least 8 characters" : undefined}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
