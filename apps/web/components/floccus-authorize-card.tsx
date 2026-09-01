"use client"

import { useState } from "react"

import { Button } from "@loomark/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@loomark/ui/components/card"

type Props = { token: string | null; email: string }

export const FloccusAuthorizeCard = ({ token, email }: Props) => {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  )
  const [error, setError] = useState<string | null>(null)

  const approve = async () => {
    if (!token) {
      return
    }

    setState("loading")
    setError(null)

    const res = await fetch("/api/floccus/login-flow/approve", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ token }),
    })

    if (!res.ok) {
      setState("error")
      setError(
        res.status === 404
          ? "This sync request expired. Go back to floccus and try again."
          : "Something went wrong. Try again."
      )
      return
    }

    setState("done")
  }

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Nothing to connect</CardTitle>
          <CardDescription>
            Open this page from floccus, not directly.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (state === "done") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connected</CardTitle>
          <CardDescription>
            You can close this tab and go back to floccus.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Connect floccus</CardTitle>
        <CardDescription>
          Sync your browser&apos;s bookmarks to {email}&apos;s Loomark library.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This creates a device token floccus uses instead of your password.
        </p>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3">
        <Button onClick={approve} disabled={state === "loading"}>
          {state === "loading" ? "Connecting…" : "Allow"}
        </Button>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardFooter>
    </Card>
  )
}
