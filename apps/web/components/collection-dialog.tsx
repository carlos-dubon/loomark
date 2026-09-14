"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import {
  buildCollectionTree,
  collectDescendantIds,
  flattenTree,
} from "@loomark/core/tree"
import { Button } from "@loomark/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loomark/ui/components/dialog"
import { Field } from "@loomark/ui/components/field"
import { Input } from "@loomark/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loomark/ui/components/select"

import { IconPicker } from "@/components/icon-picker"
import { useCollections } from "@/hooks/use-collections"
import { api } from "@/lib/client/api"
import { collectionsQuery, upsertCollectionInCache } from "@/lib/client/queries"
import {
  collectionCreateSchema,
  type CollectionCreateInput,
} from "@/lib/schemas"
import { collectionDialogAtom, type CollectionDialogState } from "@/store/atoms"

const NONE = "__root__"

const CollectionForm = ({
  state,
  onClose,
}: {
  state: CollectionDialogState
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const collections = useCollections()
  const editing = state.collection

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(collectionCreateSchema),
    defaultValues: {
      name: editing?.name ?? "",
      icon: editing?.icon ?? null,
      parentId: editing?.parentId ?? state.parentId ?? null,
    },
  })

  const { mutateAsync: save } = useMutation({
    mutationFn: (values: CollectionCreateInput) =>
      editing
        ? api.updateCollection(editing.id, values)
        : api.createCollection(values),
    onSuccess: (collection) => {
      upsertCollectionInCache(queryClient, collection)
      void queryClient.invalidateQueries({
        queryKey: collectionsQuery.queryKey,
      })
    },
  })

  const options = useMemo(() => {
    const excluded = editing
      ? new Set(collectDescendantIds(collections, editing.id))
      : new Set<string>()

    return flattenTree(buildCollectionTree(collections)).filter(
      (node) => node.kind === "USER" && !excluded.has(node.id)
    )
  }, [collections, editing])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save(values)
      toast.success(editing ? "Collection updated" : "Collection created")
      onClose()
    } catch (cause) {
      toast.error(errorMessage(cause, "Something went wrong"))
    }
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editing ? "Edit collection" : "New collection"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field
          label="Name"
          htmlFor="collection-name"
          error={errors.name ? "Give the collection a name" : undefined}
        >
          <Input
            id="collection-name"
            placeholder="Reading list"
            autoFocus
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </Field>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <IconPicker value={field.value ?? null} onChange={field.onChange} />
          )}
        />
        <Field label="Parent" htmlFor="collection-parent">
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <Select
                value={field.value ?? NONE}
                onValueChange={(value) =>
                  field.onChange(value === NONE ? null : String(value))
                }
              >
                <SelectTrigger id="collection-parent" className="w-full">
                  <SelectValue>
                    {(value) =>
                      value && value !== NONE
                        ? (options.find((node) => node.id === value)?.name ??
                          "No parent")
                        : "No parent"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No parent</SelectItem>
                  {options.map((node) => (
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
        </Field>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export const CollectionDialog = () => {
  const [state, setState] = useAtom(collectionDialogAtom)
  const [formKey, setFormKey] = useState(0)
  const [wasOpen, setWasOpen] = useState(state.open)

  if (wasOpen !== state.open) {
    setWasOpen(state.open)

    if (state.open) {
      setFormKey((value) => value + 1)
    }
  }

  const close = () =>
    setState({ open: false, collection: null, parentId: null })

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          close()
        }
      }}
    >
      <DialogContent>
        <CollectionForm key={formKey} state={state} onClose={close} />
      </DialogContent>
    </Dialog>
  )
}
