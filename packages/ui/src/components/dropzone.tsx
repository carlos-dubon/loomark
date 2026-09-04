"use client"

import { UploadCloudIcon, XIcon } from "lucide-react"
import * as React from "react"

import { Button } from "./button"
import { cn } from "@loomark/core/utils"

type DropzoneContextValue = {
  accept?: string
  maxSize?: number
  multiple: boolean
  disabled: boolean
  dragging: boolean
  inputId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  open: () => void
  onFiles: (files: File[]) => void
  setDragging: (dragging: boolean) => void
}

const DropzoneContext = React.createContext<DropzoneContextValue | null>(null)

const UNITS = ["B", "KB", "MB", "GB"]

const formatSize = (bytes: number) => {
  let value = bytes
  let unit = 0

  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }

  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${UNITS[unit]}`
}

const useDropzone = () => {
  const context = React.useContext(DropzoneContext)

  if (!context) {
    throw new Error("Dropzone components must be used inside <Dropzone>")
  }

  return context
}

const matchesAccept = (file: File, accept?: string) => {
  if (!accept) {
    return true
  }

  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  return accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => {
      if (entry.startsWith(".")) {
        return name.endsWith(entry)
      }

      if (entry.endsWith("/*")) {
        return type.startsWith(entry.slice(0, -1))
      }

      return type === entry
    })
}

export type DropzoneProps = Omit<
  React.ComponentProps<"div">,
  "onDrop" | "onError"
> & {
  accept?: string
  maxSize?: number
  multiple?: boolean
  disabled?: boolean
  onDrop: (files: File[]) => void
  onError?: (message: string) => void
}

const Dropzone = ({
  className,
  accept,
  maxSize,
  multiple = false,
  disabled = false,
  onDrop,
  onError,
  children,
  ...props
}: DropzoneProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const inputId = React.useId()
  const [dragging, setDragging] = React.useState(false)

  const onFiles = (incoming: File[]) => {
    if (disabled || incoming.length === 0) {
      return
    }

    const files = multiple ? incoming : incoming.slice(0, 1)
    const rejected = files.find((file) => !matchesAccept(file, accept))

    if (rejected) {
      onError?.(`${rejected.name} is not a supported file type`)
      return
    }

    const oversized = maxSize
      ? files.find((file) => file.size > maxSize)
      : undefined

    if (oversized && maxSize) {
      onError?.(
        `${oversized.name} is larger than the ${formatSize(maxSize)} limit`
      )
      return
    }

    onDrop(files)
  }

  const value: DropzoneContextValue = {
    accept,
    maxSize,
    multiple,
    disabled,
    dragging,
    inputId,
    inputRef,
    open: () => inputRef.current?.click(),
    onFiles,
    setDragging,
  }

  return (
    <DropzoneContext.Provider value={value}>
      <div
        data-slot="dropzone"
        data-dragging={dragging || undefined}
        data-disabled={disabled || undefined}
        className={cn("flex flex-col gap-3", className)}
        {...props}
      >
        {children}
      </div>
    </DropzoneContext.Provider>
  )
}

const DropzoneInput = () => {
  const { accept, multiple, disabled, inputId, inputRef, onFiles } =
    useDropzone()

  return (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      className="sr-only"
      onChange={(event) => {
        onFiles(Array.from(event.target.files ?? []))
        event.target.value = ""
      }}
    />
  )
}

const DropzoneArea = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { disabled, dragging, inputId, open, onFiles, setDragging } =
    useDropzone()
  const depth = React.useRef(0)

  return (
    <div
      data-slot="dropzone-area"
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-controls={inputId}
      onClick={() => open()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          open()
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        depth.current += 1

        if (!disabled) {
          setDragging(true)
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        depth.current -= 1

        if (depth.current <= 0) {
          depth.current = 0
          setDragging(false)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        depth.current = 0
        setDragging(false)
        onFiles(Array.from(event.dataTransfer.files))
      }}
      className={cn(
        "group/dropzone flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input px-6 py-10 text-center transition-colors outline-none select-none hover:border-ring/60 hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-dragging:border-primary data-dragging:bg-accent/60 data-disabled:pointer-events-none data-disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const DropzoneIcon = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="dropzone-icon"
    className={cn(
      "flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-data-dragging/dropzone:bg-primary/10 group-data-dragging/dropzone:text-primary",
      className
    )}
    {...props}
  >
    <UploadCloudIcon className="size-5" />
  </div>
)

const DropzoneTitle = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    data-slot="dropzone-title"
    className={cn("text-sm font-medium", className)}
    {...props}
  />
)

const DropzoneDescription = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    data-slot="dropzone-description"
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
)

const DropzoneFileList = ({
  className,
  ...props
}: React.ComponentProps<"ul">) => (
  <ul
    data-slot="dropzone-file-list"
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
)

const DropzoneFile = ({
  className,
  file,
  preview,
  onRemove,
  ...props
}: Omit<React.ComponentProps<"li">, "children"> & {
  file: File
  preview?: React.ReactNode
  onRemove?: () => void
}) => (
  <li
    data-slot="dropzone-file"
    className={cn(
      "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
      className
    )}
    {...props}
  >
    {preview}
    <span className="min-w-0 flex-1">
      <span className="block truncate font-medium">{file.name}</span>
      <span className="block text-xs text-muted-foreground">
        {formatSize(file.size)}
      </span>
    </span>
    {onRemove ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
      >
        <XIcon />
      </Button>
    ) : null}
  </li>
)

export {
  Dropzone,
  DropzoneArea,
  DropzoneDescription,
  DropzoneFile,
  DropzoneFileList,
  DropzoneIcon,
  DropzoneInput,
  DropzoneTitle,
  formatSize,
}
