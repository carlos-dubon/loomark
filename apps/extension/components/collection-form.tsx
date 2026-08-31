import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"

import { flattenCollections } from "@loomark/core/tree"
import type { CollectionDTO } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import { Field, FieldInput, FieldSelect } from "@loomark/ui/components/field"

import { IconPicker } from "@/components/icon-picker"
import { createCollection, type Auth } from "@/lib/api"
import { collectionFormSchema, type CollectionFormValues } from "@/lib/schemas"

const ROOT = "__root__"

export const CollectionForm = ({
  auth,
  collections,
  defaultParentId,
  onCreated,
  onCancel,
}: {
  auth: Auth
  collections: CollectionDTO[]
  defaultParentId: string | null
  onCreated: (collection: CollectionDTO) => void
  onCancel: () => void
}) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: { name: "", icon: null, parentId: defaultParentId },
  })

  const parents = flattenCollections(collections).filter(
    (node) => node.kind === "USER"
  )

  const onSubmit = handleSubmit(async (values) => {
    try {
      onCreated(await createCollection(auth, values))
    } catch (cause) {
      setError("root", {
        message: cause instanceof Error ? cause.message : "Could not create it",
      })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          aria-label="Back"
          onClick={onCancel}
        >
          <ArrowLeftIcon />
        </Button>
        <h2 className="text-sm font-medium">New collection</h2>
      </div>
      <Field
        label="Name"
        htmlFor="collection-name"
        error={errors.name?.message}
      >
        <FieldInput
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
          <IconPicker value={field.value} onChange={field.onChange} />
        )}
      />
      <Field label="Parent" htmlFor="collection-parent">
        <Controller
          control={control}
          name="parentId"
          render={({ field }) => (
            <FieldSelect
              id="collection-parent"
              value={field.value ?? ROOT}
              onChange={(event) =>
                field.onChange(
                  event.target.value === ROOT ? null : event.target.value
                )
              }
            >
              <option value={ROOT}>No parent</option>
              {parents.map((node) => (
                <option key={node.id} value={node.id}>
                  {`${"  ".repeat(node.depth)}${node.name}`}
                </option>
              ))}
            </FieldSelect>
          )}
        />
      </Field>
      {errors.root ? (
        <p className="text-xs text-destructive" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create"}
        </Button>
      </div>
    </form>
  )
}
