"use client"

import { useSetAtom } from "jotai"
import {
  DownloadIcon,
  FileCodeIcon,
  Loader2Icon,
  UploadIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

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
import { api } from "@/lib/client-api"
import { collectionsAtom } from "@/store/atoms"

const IMPORT_MAX_BYTES = 10 * 1024 * 1024

const plural = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`

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
  const setCollections = useSetAtom(collectionsAtom)

  const [file, setFile] = useState<File | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [importing, setImporting] = useState(false)

  const onImport = async () => {
    if (!file) {
      return
    }

    setSummary(null)
    setImporting(true)

    try {
      const result = await api.importBookmarks(file)

      setSummary(result)
      setFile(null)

      if (result.bookmarks === 0) {
        toast.info("Nothing new to import")
      } else {
        toast.success(`${plural(result.bookmarks, "bookmark")} imported`)
      }

      setCollections(await api.listCollections())
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  return (
    <SettingsPage
      title="Import and export"
      description="Move your library in and out"
    >
      <SettingsCard
        title="Import bookmarks"
        description="Upload an HTML bookmarks file exported from Chrome, Edge, Safari, Firefox, or any other browser that speaks the same format, or a JSON backup exported from Linkwarden. Folders and collections come across and links you already saved are left alone."
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
                Drop your bookmarks file or click to browse
              </DropzoneTitle>
              <DropzoneDescription>
                A single .html or .json export, up to 10 MB
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
            <Button
              disabled={!file || importing}
              onClick={() => void onImport()}
            >
              {importing ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <UploadIcon />
              )}
              {importing ? "Importing…" : "Import"}
            </Button>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard
        title="Export bookmarks"
        description={`Download ${plural(bookmarkCount, "bookmark")} across ${plural(collectionCount, "collection")} as a Chrome compatible HTML file. Keep it as a backup or import it into any browser.`}
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
