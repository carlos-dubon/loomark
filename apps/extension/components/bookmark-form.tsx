import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, WandSparklesIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

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
  updateBookmark,
  type Auth,
} from "@/lib/api"
import { notifyBookmarksChanged } from "@/lib/messages"
import { lastCollectionIdQuery, metadataQuery } from "@/lib/queries"
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
  const queryClient = useQueryClient()
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
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

  const { mutate: loadMetadata, isPending: fetching } = useMutation({
    mutationFn: () => queryClient.fetchQuery(metadataQuery(auth, tab.url)),
    onSuccess: (metadata) => {
      setValue("title", metadata.title, { shouldValidate: true })
      setValue("description", metadata.description ?? "")
    },
    onError: () => {
      toast.error("Could not read that page")
    },
  })

  const { mutate: removeBookmark, isPending: removing } = useMutation({
    mutationFn: async (id: string) => {
      await deleteBookmark(auth, id)
      await notifyBookmarksChanged()
    },
    onSuccess: () => {
      onRemoved()
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Could not remove it"))
    },
    onSettled: () => {
      setConfirmingRemove(false)
    },
  })

  const { mutateAsync: save } = useMutation({
    mutationFn: async (payload: {
      title?: string
      description: string | null
      collectionId: string | null
      pinned: boolean
    }) => {
      const saved = bookmark
        ? await updateBookmark(auth, bookmark.id, payload)
        : await createBookmark(auth, { url: tab.url, ...payload })

      await writeLastCollectionId(saved.collectionId)
      await notifyBookmarksChanged()

      return saved
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(
        lastCollectionIdQuery.queryKey,
        saved.collectionId
      )
      onSaved(saved)
    },
  })

  const remove = () => {
    if (!bookmark) {
      return
    }

    if (!confirmingRemove) {
      setConfirmingRemove(true)
      return
    }

    removeBookmark(bookmark.id)
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      title: values.title.trim() || undefined,
      description: values.description.trim() || null,
      collectionId: values.collectionId || null,
      pinned: values.pinned,
    }

    try {
      await save(payload)
    } catch (cause) {
      toast.error(errorMessage(cause, "Could not save it"))
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
            onClick={() => loadMetadata()}
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
