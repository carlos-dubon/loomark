"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { IconPicker } from "@/components/icon-picker"
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
import { api } from "@/lib/client-api"
import { collectionCreateSchema } from "@/lib/schemas"
import {
  buildCollectionTree,
  collectDescendantIds,
  flattenTree,
} from "@/lib/tree"
import {
  collectionDialogAtom,
  collectionsAtom,
  upsertCollectionAtom,
  type CollectionDialogState,
} from "@/store/atoms"

const NONE = "__root__"

const CollectionForm = ({
  state,
  onClose,
}: {
  state: CollectionDialogState
  onClose: () => void
}) => {
  const router = useRouter()
  const collections = useAtomValue(collectionsAtom)
  const upsertCollection = useSetAtom(upsertCollectionAtom)
  const editing = state.collection

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(collectionCreateSchema),
    defaultValues: {
      name: editing?.name ?? "",
      icon: editing?.icon ?? null,
      parentId: editing?.parentId ?? state.parentId ?? null,
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
      const collection = editing
        ? await api.updateCollection(editing.id, values)
        : await api.createCollection(values)

      upsertCollection(collection)
      toast.success(editing ? "Collection updated" : "Collection created")
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
        <DialogTitle>
          {editing ? "Edit collection" : "New collection"}
        </DialogTitle>
        <DialogDescription>
          Collections nest, so build the tree however you think.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="collection-name">Name</Label>
          <Input
            id="collection-name"
            placeholder="Reading list"
            autoFocus
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive" role="alert">
              Give the collection a name
            </p>
          ) : null}
        </div>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <IconPicker value={field.value ?? null} onChange={field.onChange} />
          )}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="collection-parent">Parent</Label>
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
