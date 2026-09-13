import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, WandSparklesIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { errorMessage } from "@loomark/core/format"
import { flattenCollections } from "@loomark/core/tree"
import type { ActiveTab, BookmarkDTO, CollectionDTO } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import { Field, NativeSelect } from "@loomark/ui/components/field"
import { Input } from "@loomark/ui/components/input"
import { Label } from "@loomark/ui/components/label"
import { Textarea } from "@loomark/ui/components/textarea"
import { Switch } from "@loomark/ui/components/switch"

import {
  createBookmark,
  deleteBookmark,
  fetchMetadata,
  updateBookmark,
  type Auth,
} from "@/lib/api"
import { notifyBookmarksChanged } from "@/lib/messages"
import { bookmarkFormSchema, type BookmarkFormValues } from "@/lib/schemas"
import { writeLastCollectionId } from "@/lib/storage"

export const BookmarkForm = ({
  auth,
  tab,
  bookmark,
  collections,
  defaultCollectionId,
  pendingCollectionId,
  onCollectionApplied,
  onSaved,
  onRemoved,
  onNewCollection,
}: {
  auth: Auth
  tab: ActiveTab
  bookmark: BookmarkDTO | null
  collections: CollectionDTO[]
  defaultCollectionId: string
  pendingCollectionId: string | null
  onCollectionApplied: () => void
  onSaved: (bookmark: BookmarkDTO) => void
  onRemoved: () => void
  onNewCollection: () => void
}) => {
  const [fetching, setFetching] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [removing, setRemoving] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues: {
      title: bookmark?.title ?? tab.title,
      description: bookmark?.description ?? "",
      collectionId: bookmark?.collectionId ?? defaultCollectionId,
      pinned: bookmark?.pinned ?? false,
    },
  })

  useEffect(() => {
    if (!pendingCollectionId) {
      return
    }

    setValue("collectionId", pendingCollectionId)
    onCollectionApplied()
  }, [pendingCollectionId, onCollectionApplied, setValue])

  const options = flattenCollections(collections)

  const loadMetadata = async () => {
    setFetching(true)

    try {
      const metadata = await fetchMetadata(auth, tab.url)
      setValue("title", metadata.title, { shouldValidate: true })
      setValue("description", metadata.description ?? "")
    } catch {
      setError("root", { message: "Could not read that page" })
    } finally {
      setFetching(false)
    }
  }

  const remove = async () => {
    if (!bookmark) {
      return
    }

    if (!confirmingRemove) {
      setConfirmingRemove(true)
      return
    }

    setRemoving(true)

    try {
      await deleteBookmark(auth, bookmark.id)
      await notifyBookmarksChanged()
      onRemoved()
    } catch (cause) {
      setError("root", {
        message: errorMessage(cause, "Could not remove it"),
      })
    } finally {
      setRemoving(false)
      setConfirmingRemove(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      title: values.title.trim() || undefined,
      description: values.description.trim() || null,
      collectionId: values.collectionId || null,
      pinned: values.pinned,
    }

    try {
      const saved = bookmark
        ? await updateBookmark(auth, bookmark.id, payload)
        : await createBookmark(auth, { url: tab.url, ...payload })

      await writeLastCollectionId(saved.collectionId)
      await notifyBookmarksChanged()
      onSaved(saved)
    } catch (cause) {
      setError("root", {
        message: errorMessage(cause, "Could not save it"),
      })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 p-3">
      <Field
        size="sm"
        label="Title"
        htmlFor="bookmark-title"
        error={errors.title?.message}
      >
        <div className="flex gap-2">
          <Input
            size="sm"
            id="bookmark-title"
            placeholder="Read from the page when left empty"
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Read details from the page"
            loading={fetching}
            onClick={loadMetadata}
          >
            <WandSparklesIcon />
          </Button>
        </div>
      </Field>
      <Field
        size="sm"
        label="Notes"
        htmlFor="bookmark-description"
        error={errors.description?.message}
      >
        <Textarea
          size="sm"
          id="bookmark-description"
          rows={2}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </Field>
      <Field size="sm" label="Collection" htmlFor="bookmark-collection">
        <div className="flex gap-2">
          <Controller
            control={control}
            name="collectionId"
            render={({ field }) => (
              <NativeSelect
                size="sm"
                id="bookmark-collection"
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value)}
              >
                {options.map((node) => (
                  <option key={node.id} value={node.id}>
                    {`${"  ".repeat(node.depth)}${node.name}`}
                  </option>
                ))}
              </NativeSelect>
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="New collection"
            onClick={onNewCollection}
          >
            <PlusIcon />
          </Button>
        </div>
      </Field>
      <div className="flex items-center justify-between gap-4">
        <Label size="sm" htmlFor="bookmark-pinned">
          Pin to homepage
        </Label>
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
        <p className="text-xs text-destructive" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        {bookmark ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isSubmitting}
            loading={removing}
            onClick={remove}
            onBlur={() => setConfirmingRemove(false)}
          >
            {removing
              ? "Removing…"
              : confirmingRemove
                ? "Tap again to remove"
                : "Remove"}
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          size="sm"
          disabled={removing}
          loading={isSubmitting}
        >
          {isSubmitting
            ? "Saving…"
            : bookmark
              ? "Save changes"
              : "Save bookmark"}
        </Button>
      </div>
    </form>
  )
}
