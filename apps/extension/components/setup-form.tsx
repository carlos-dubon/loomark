import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import type { Connection } from "@loomark/core/types"
import { safeNormalizeUrl } from "@loomark/core/url"
import { Button } from "@loomark/ui/components/button"
import { Field, FieldInput } from "@loomark/ui/components/field"

import { connect } from "@/lib/api"
import { hasHostPermission, requestHostPermission } from "@/lib/permissions"
import {
  credentialsSchema,
  serverUrlSchema,
  type CredentialsValues,
  type ServerUrlValues,
} from "@/lib/schemas"
import {
  clearDraftServerUrl,
  readDraftServerUrl,
  writeDraftServerUrl,
} from "@/lib/storage"

const ServerStep = ({
  defaultValue,
  onNext,
}: {
  defaultValue: string
  onNext: (serverUrl: string) => void
}) => {
  const [pending, setPending] = useState(false)

  const {
    register,
    getValues,
    setError,
    formState: { errors },
  } = useForm<ServerUrlValues>({
    resolver: zodResolver(serverUrlSchema),
    defaultValues: { serverUrl: defaultValue },
  })

  const onContinue = () => {
    const parsed = serverUrlSchema.safeParse(getValues())
    const normalized = parsed.success
      ? safeNormalizeUrl(parsed.data.serverUrl)
      : null

    if (!normalized) {
      setError("serverUrl", {
        message:
          parsed.success === false
            ? (parsed.error.issues[0]?.message ?? "Enter your Loomark URL")
            : "That does not look like a URL",
      })

      return
    }

    setPending(true)

    requestHostPermission(normalized)
      .then((granted) => {
        if (!granted) {
          setError("serverUrl", {
            message: "Loomark needs permission to reach that server",
          })

          return
        }

        return writeDraftServerUrl(normalized).then(() => onNext(normalized))
      })
      .catch(() =>
        setError("serverUrl", { message: "Could not request permission" })
      )
      .finally(() => setPending(false))
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Connect to Loomark</h1>
        <p className="text-xs text-muted-foreground">
          Point the extension at your server, then sign in.
        </p>
      </div>
      <Field
        label="Server URL"
        htmlFor="server-url"
        error={errors.serverUrl?.message}
      >
        <FieldInput
          id="server-url"
          placeholder="https://loomark.example.com"
          autoFocus
          inputMode="url"
          aria-invalid={Boolean(errors.serverUrl)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onContinue()
            }
          }}
          {...register("serverUrl")}
        />
      </Field>
      <Button type="button" disabled={pending} onClick={onContinue}>
        {pending ? "Waiting for permission…" : "Continue"}
      </Button>
    </div>
  )
}

const CredentialsStep = ({
  serverUrl,
  onBack,
  onConnected,
}: {
  serverUrl: string
  onBack: () => void
  onConnected: (connection: Connection) => void
}) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { token, user } = await connect(serverUrl, values)

      await clearDraftServerUrl()
      onConnected({ serverUrl, token, user })
    } catch (cause) {
      setError("root", {
        message: cause instanceof Error ? cause.message : "Could not sign in",
      })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          aria-label="Change server"
          onClick={onBack}
        >
          <ArrowLeftIcon />
        </Button>
        <div className="flex min-w-0 flex-col">
          <h1 className="text-sm font-medium">Sign in</h1>
          <p className="truncate text-xs text-muted-foreground">{serverUrl}</p>
        </div>
      </div>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <FieldInput
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <FieldInput
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
      </Field>
      {errors.root ? (
        <p className="text-xs text-destructive" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Connecting…" : "Connect"}
      </Button>
    </form>
  )
}

export const SetupForm = ({
  onConnected,
}: {
  onConnected: (connection: Connection) => void
}) => {
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [draft, setDraft] = useState<string | null>(null)

  useEffect(() => {
    void readDraftServerUrl().then(async (stored) => {
      setDraft(stored ?? "")

      if (stored && (await hasHostPermission(stored))) {
        setServerUrl(stored)
      }
    })
  }, [])

  if (draft === null) {
    return null
  }

  return serverUrl ? (
    <CredentialsStep
      serverUrl={serverUrl}
      onBack={() => setServerUrl(null)}
      onConnected={onConnected}
    />
  ) : (
    <ServerStep defaultValue={draft} onNext={setServerUrl} />
  )
}
