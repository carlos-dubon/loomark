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
import { Input } from "@loomark/ui/components/input"
import { Label } from "@loomark/ui/components/label"

import { DEMO_CREDENTIALS } from "@/lib/demo/config"
import { signIn } from "@/lib/demo/store"

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
        <CardTitle>Welcome to the demo</CardTitle>
        <CardDescription>
          The credentials are already filled in — just sign in.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              readOnly
              defaultValue={DEMO_CREDENTIALS.email}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              readOnly
              defaultValue={DEMO_CREDENTIALS.password}
            />
          </div>
          <Alert variant="warning">
            <DatabaseZapIcon />
            <AlertTitle>Nothing here is saved</AlertTitle>
            <AlertDescription>
              This demo runs on an in-memory database that lives only in this
              browser tab. Add, edit, drag and archive anything you want —
              refreshing the page wipes it clean.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="mt-4 flex-col items-stretch gap-3">
          <Button type="submit" disabled={pending}>
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
