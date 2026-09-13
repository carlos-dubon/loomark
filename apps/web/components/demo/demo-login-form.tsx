"use client"

import { DatabaseZapIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@loomark/ui/components/alert"
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

import { DEMO_CREDENTIALS } from "@/lib/demo/config"
import { signIn } from "@/lib/client/demo/store"

export const DemoLoginForm = () => {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    signIn()
    router.replace("/")
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to reach your library.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              readOnly
              defaultValue={DEMO_CREDENTIALS.email}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              readOnly
              defaultValue={DEMO_CREDENTIALS.password}
            />
          </Field>
          <Alert variant="warning">
            <DatabaseZapIcon />
            <AlertTitle>Nothing here is saved</AlertTitle>
            <AlertDescription>
              This demo runs on an in-memory database that lives only in this
              browser tab.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="mt-4 flex-col items-stretch gap-3">
          <Button type="submit" loading={pending}>
            {pending ? "Opening the demo…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Want the real thing?{" "}
            <a
              href="https://github.com/carlos-dubon/loomark"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline"
            >
              Self-host Loomark
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
