"use client"

import { useSetAtom } from "jotai"
import { DownloadIcon, Loader2Icon, UploadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/client-api"
import type { ImportSummary } from "@/lib/types"
import { collectionsAtom } from "@/store/atoms"

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

export const SettingsView = ({
  bookmarkCount,
  collectionCount,
}: {
  bookmarkCount: number
  collectionCount: number
}) => {
  const router = useRouter()
  const setCollections = useSetAtom(collectionsAtom)

  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<{ files: FileList | null }>({ defaultValues: { files: null } })

  const files = useWatch({ control, name: "files" })
  const fileField = register("files", { required: true })

  const onImport = handleSubmit(async (values) => {
    const file = values.files?.[0]

    if (!file) {
      return
    }

    setSummary(null)

    try {
      const result = await api.importBookmarks(file)

      setSummary(result)
      reset()

      if (result.bookmarks === 0) {
        toast.info("Nothing new to import")
      } else {
        toast.success(`${plural(result.bookmarks, "bookmark")} imported`)
      }

      setCollections(await api.listCollections())
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Import failed")
    }
  })

  return (
    <>
      <PageHeader title="Settings" description="Import and export your shelf" />
      <div className="flex min-h-0 flex-1 scroll-fade-b flex-col gap-4 overflow-y-auto p-4 md:p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Import bookmarks</CardTitle>
            <CardDescription>
              Upload an HTML bookmarks file exported from Chrome, Edge, Safari,
              Firefox, or any other browser that speaks the same format. Folders
              become collections and links you already saved are left alone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onImport} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="import-file">Bookmarks file</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".html,.htm,text/html"
                  disabled={isSubmitting}
                  className="h-auto py-1.5 file:mr-2 file:cursor-pointer"
                  {...fileField}
                  onChange={(event) => {
                    void fileField.onChange(event)
                    setSummary(null)
                  }}
                />
              </div>
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
                  type="submit"
                  disabled={!files || files.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <UploadIcon />
                  )}
                  {isSubmitting ? "Importing…" : "Import"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Export bookmarks</CardTitle>
            <CardDescription>
              Download {plural(bookmarkCount, "bookmark")} across{" "}
              {plural(collectionCount, "collection")} as a Chrome compatible
              HTML file. Keep it as a backup or import it into any browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href="/api/bookmarks/export" download />}
            >
              <DownloadIcon />
              Export
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
