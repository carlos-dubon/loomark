"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { DownloadIcon, FileCodeIcon, UploadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { errorMessage, plural } from "@loomark/core/format"
import type { ImportSummary } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import {
  Dropzone,
  DropzoneArea,
  DropzoneDescription,
  DropzoneFile,
  DropzoneFileList,
  DropzoneIcon,
  DropzoneInput,
  DropzoneTitle,
} from "@loomark/ui/components/dropzone"

import { SettingsCard, SettingsPage } from "@/components/settings/settings-page"
import { api } from "@/lib/client/api"
import { invalidateLibrary } from "@/lib/client/queries"

const IMPORT_MAX_BYTES = 10 * 1024 * 1024

const summaryLines = (summary: ImportSummary) =>
  [
    `${plural(summary.bookmarks, "bookmark")} imported`,
    summary.collections > 0
      ? `${plural(summary.collections, "collection")} created`
      : null,
    summary.duplicates > 0
      ? `${plural(summary.duplicates, "duplicate")} skipped`
      : null,
    summary.skipped > 0
      ? `${plural(summary.skipped, "unsupported link")} skipped`
      : null,
  ].filter((line) => line !== null)

export const TransferView = ({
  bookmarkCount,
  collectionCount,
}: {
  bookmarkCount: number
  collectionCount: number
}) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [file, setFile] = useState<File | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const { mutate: importFile, isPending: importing } = useMutation({
    mutationFn: (selected: File) => api.importBookmarks(selected),
    onMutate: () => {
      setSummary(null)
    },
    onSuccess: async (result) => {
      setSummary(result)
      setFile(null)

      if (result.bookmarks === 0) {
        toast.info("Nothing new to import")
      } else {
        toast.success(`${plural(result.bookmarks, "bookmark")} imported`)
      }

      await invalidateLibrary(queryClient)
      router.refresh()
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Import failed"))
    },
  })

  const onImport = () => {
    if (file) {
      importFile(file)
    }
  }

  return (
    <SettingsPage title="Import and export">
      <SettingsCard
        title="Import bookmarks"
        description="Browser HTML export or Linkwarden JSON."
      >
        <div className="flex flex-col gap-4">
          <Dropzone
            accept=".html,.htm,.json,text/html,application/json"
            maxSize={IMPORT_MAX_BYTES}
            disabled={importing}
            onDrop={(files) => {
              setFile(files[0])
              setSummary(null)
            }}
            onError={(message) => toast.error(message)}
          >
            <DropzoneInput />
            <DropzoneArea>
              <DropzoneIcon />
              <DropzoneTitle>
                Drop a bookmarks file or click to browse
              </DropzoneTitle>
              <DropzoneDescription>
                .html or .json, up to 10 MB
              </DropzoneDescription>
            </DropzoneArea>
            {file ? (
              <DropzoneFileList>
                <DropzoneFile
                  file={file}
                  preview={
                    <FileCodeIcon className="size-4 shrink-0 text-muted-foreground" />
                  }
                  onRemove={importing ? undefined : () => setFile(null)}
                />
              </DropzoneFileList>
            ) : null}
          </Dropzone>
          {summary ? (
            <div
              className="rounded-lg border border-dashed px-3 py-2 text-sm"
              role="status"
            >
              {summaryLines(summary).map((line) => (
                <p key={line} className="text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
          <div>
            <Button disabled={!file} loading={importing} onClick={onImport}>
              <UploadIcon aria-hidden="true" />
              Import
            </Button>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard
        title="Export bookmarks"
        description={`${plural(bookmarkCount, "bookmark")} in ${plural(collectionCount, "collection")}, as browser HTML.`}
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href="/api/bookmarks/export" download />}
        >
          <DownloadIcon />
          Export
        </Button>
      </SettingsCard>
    </SettingsPage>
  )
}
