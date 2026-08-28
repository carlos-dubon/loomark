"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { Loader2Icon, WandSparklesIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/client-api"
import { normalizeUrl } from "@/lib/format"
import { buildCollectionTree, flattenTree } from "@/lib/tree"
import {
  bookmarkDialogAtom,
  collectionsAtom,
  upsertBookmarkAtom,
  type BookmarkDialogState,
} from "@/store/atoms"

const NONE = "__unsorted__"

const safeNormalizeUrl = (value: string) => {
  try {
    const normalized = normalizeUrl(value)

    return /[%\s]/.test(new URL(normalized).hostname) ? null : normalized
  } catch {
    return null
  }
}

const bookmarkFormSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a URL")
    .max(2000)
    .refine((value) => safeNormalizeUrl(value) !== null, "Enter a valid URL"),
  title: z.string().trim().max(300),
  description: z.string().trim().max(2000),
  faviconUrl: z.string().nullable(),
  previewUrl: z.string().nullable(),
  collectionId: z.string().nullable(),
  pinned: z.boolean(),
})

const BookmarkForm = ({
  state,
  onClose,
}: {
  state: BookmarkDialogState
  onClose: () => void
}) => {
  const router = useRouter()
  const collections = useAtomValue(collectionsAtom)
  const upsertBookmark = useSetAtom(upsertBookmarkAtom)
  const editing = state.bookmark

  const [fetching, setFetching] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues: {
      url: editing?.url ?? "",
      title: editing?.title ?? "",
      description: editing?.description ?? "",
      faviconUrl: editing?.faviconUrl ?? null,
      previewUrl: editing?.previewUrl ?? null,
      collectionId: editing?.collectionId ?? state.collectionId ?? null,
      pinned: editing?.pinned ?? false,
    },
  })

  const url = useWatch({ control, name: "url" })

  const flat = useMemo(
    () => flattenTree(buildCollectionTree(collections)),
    [collections]
  )

  const loadMetadata = async () => {
    const normalized = safeNormalizeUrl(getValues("url"))

    if (!normalized) {
      return
    }

    setFetching(true)

    try {
      const metadata = await api.fetchMetadata(normalized)
      setValue("title", metadata.title, { shouldValidate: true })
      setValue("description", metadata.description ?? "")
      setValue("faviconUrl", metadata.faviconUrl)
      setValue("previewUrl", metadata.previewUrl)
    } catch {
      toast.error("Could not read that page")
    } finally {
      setFetching(false)
    }
  }

  const urlField = register("url")

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = {
        url: normalizeUrl(values.url),
        title: values.title || undefined,
        description: values.description || null,
        faviconUrl: values.faviconUrl,
        previewUrl: values.previewUrl,
        collectionId: values.collectionId,
        pinned: values.pinned,
      }

      const bookmark = editing
        ? await api.updateBookmark(editing.id, payload)
        : await api.createBookmark(payload)

      upsertBookmark(bookmark)
      toast.success(editing ? "Bookmark updated" : "Bookmark saved")
      onClose()
      router.refresh()
    } catch (cause) {
      setError("root", {
        message:
          cause instanceof Error ? cause.message : "Something went wrong",
      })
    }
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit bookmark" : "New bookmark"}</DialogTitle>
        <DialogDescription>
          Paste a link and Loomark fills in the rest.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="bookmark-url">URL</Label>
          <div className="flex gap-2">
            <Input
              id="bookmark-url"
              placeholder="https://example.com"
              autoFocus
              aria-invalid={Boolean(errors.url)}
              {...urlField}
              onBlur={(event) => {
                void urlField.onBlur(event)

                if (!getValues("title").trim()) {
                  void loadMetadata()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Fetch page details"
              disabled={fetching || !url.trim()}
              onClick={loadMetadata}
            >
              {fetching ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <WandSparklesIcon />
              )}
            </Button>
          </div>
          {errors.url ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.url.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bookmark-title">Title</Label>
          <Input
            id="bookmark-title"
            placeholder="Read from the page when left empty"
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.title.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bookmark-description">Description</Label>
          <Textarea
            id="bookmark-description"
            rows={2}
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bookmark-collection">Collection</Label>
          <Controller
            control={control}
            name="collectionId"
            render={({ field }) => (
              <Select
                value={field.value ?? NONE}
                onValueChange={(value) =>
                  field.onChange(value === NONE ? null : String(value))
                }
              >
                <SelectTrigger id="bookmark-collection" className="w-full">
                  <SelectValue>
                    {(value) =>
                      value && value !== NONE
                        ? (flat.find((node) => node.id === value)?.name ??
                          "Unsorted")
                        : "Unsorted"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unsorted</SelectItem>
                  {flat.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      <span style={{ paddingLeft: node.depth * 10 }}>
                        {node.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="flex flex-col">
            <Label htmlFor="bookmark-pinned">Pin to homepage</Label>
            <span className="text-xs text-muted-foreground">
              Keep it one click away.
            </span>
          </div>
          <Controller
            control={control}
            name="pinned"
            render={({ field }) => (
              <Switch
                id="bookmark-pinned"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        {errors.root ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Save bookmark"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export const BookmarkDialog = () => {
  const [state, setState] = useAtom(bookmarkDialogAtom)
  const [formKey, setFormKey] = useState(0)
  const [wasOpen, setWasOpen] = useState(state.open)

  if (wasOpen !== state.open) {
    setWasOpen(state.open)

    if (state.open) {
      setFormKey((value) => value + 1)
    }
  }

  const close = () =>
    setState({ open: false, bookmark: null, collectionId: null })

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          close()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <BookmarkForm key={formKey} state={state} onClose={close} />
      </DialogContent>
    </Dialog>
  )
}
