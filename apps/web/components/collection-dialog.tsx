"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import {
  buildCollectionTree,
  collectDescendantIds,
  flattenTree,
} from "@loomark/core/tree"
import type { CollectionDTO } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loomark/ui/components/dialog"
import { Field } from "@loomark/ui/components/field"
import { IconPicker } from "@loomark/ui/components/icon-picker"
import { Input } from "@loomark/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loomark/ui/components/select"

import { useCollections } from "@/hooks/use-collections"
import { useRemountKey } from "@/hooks/use-remount-key"
import { api } from "@/lib/client/api"
import { collectionsQuery, upsertCollectionInCache } from "@/lib/client/queries"
import {
  collectionCreateSchema,
  type CollectionCreateInput,
} from "@/lib/schemas"
import { collectionDialogAtom } from "@/store/atoms"

const NONE = "__root__"

type CollectionFormDialogProps = {
  open: boolean
  collection: CollectionDTO | null
  parentId: string | null
  onClose: () => void
  onSaved?: (collection: CollectionDTO) => void
}

const CollectionForm = ({
  collection: editing,
  parentId,
  onClose,
  onSaved,
}: Omit<CollectionFormDialogProps, "open">) => {
  const queryClient = useQueryClient()
  const collections = useCollections()

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
      parentId: editing?.parentId ?? parentId,
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
      const saved = await save(values)
      toast.success(editing ? "Collection updated" : "Collection created")
      onSaved?.(saved)
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
            {editing ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export const CollectionFormDialog = ({
  open,
  collection,
  parentId,
  onClose,
  onSaved,
}: CollectionFormDialogProps) => {
  const formKey = useRemountKey(open)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <CollectionForm
          key={formKey}
          collection={collection}
          parentId={parentId}
          onClose={onClose}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  )
}

export const CollectionDialog = () => {
  const [state, setState] = useAtom(collectionDialogAtom)

  return (
    <CollectionFormDialog
      {...state}
      onClose={() =>
        setState({ open: false, collection: null, parentId: null })
      }
    />
  )
}
