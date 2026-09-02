"use client"

import { useSetAtom } from "jotai"
import { useHydrateAtoms } from "jotai/utils"
import {
  DownloadIcon,
  FileCodeIcon,
  Loader2Icon,
  UploadIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import type { ArchiveSettings as ArchiveSettingsValue } from "@loomark/core/archive"
import type { ImportSummary } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loomark/ui/components/card"
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

import { Link } from "@/components/link"
import { PageHeader } from "@/components/page-header"
import { ArchiveSettings } from "@/components/settings/archive-settings"
import { LinkSettings } from "@/components/settings/link-settings"
import { SidebarSettings } from "@/components/settings/sidebar-settings"
import { ThemePicker } from "@/components/settings/theme-picker"
import { api } from "@/lib/client-api"
import { archiveSettingsAtom, collectionsAtom } from "@/store/atoms"

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

export const SettingsView = ({
  archiveSettings,
  bookmarkCount,
  collectionCount,
  version,
}: {
  archiveSettings: ArchiveSettingsValue
  bookmarkCount: number
  collectionCount: number
  version: string
}) => {
  useHydrateAtoms([[archiveSettingsAtom, archiveSettings]])

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
    <>
      <PageHeader
        title="Settings"
        description="Appearance, import and export"
      />
      <div className="flex min-h-0 flex-1 scroll-fade-b flex-col gap-4 overflow-y-auto p-4 md:p-6">
        <Card className="w-full max-w-2xl shrink-0">
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Every preset from tweakcn, colours, radius, shadows and fonts
              included. Light and dark both come along, so the mode toggle keeps
              working. Press D to switch modes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemePicker />
          </CardContent>
        </Card>
        <Card className="w-full max-w-2xl shrink-0">
          <CardHeader>
            <CardTitle>Sidebar</CardTitle>
            <CardDescription>
              Park the sidebar on either edge of the window, and dial in a film
              grain over it. The grain is purely decorative and follows whatever
              theme you picked above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SidebarSettings />
          </CardContent>
        </Card>
        <Card className="w-full max-w-2xl shrink-0">
          <CardHeader>
            <CardTitle>Links</CardTitle>
            <CardDescription>
              Bookmarks and other outside links open in a new tab by default. If
              Loomark is your new tab page, turn this off so they load in the
              tab you are already in and the back button brings you home. Kept
              in a cookie on this browser, not on your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkSettings />
          </CardContent>
        </Card>
        <Card className="w-full max-w-2xl shrink-0">
          <CardHeader>
            <CardTitle>Archive</CardTitle>
            <CardDescription>
              Keep your own copy of every page you save, so the bookmark still
              means something once the site goes down or quietly rewrites the
              article. Formats you turn on here are captured for every new
              bookmark; existing ones are left alone until you ask for them.
              Archives live on the server disk, so watch the space.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArchiveSettings />
          </CardContent>
        </Card>
        <Card className="w-full max-w-2xl shrink-0">
          <CardHeader>
            <CardTitle>Import bookmarks</CardTitle>
            <CardDescription>
              Upload an HTML bookmarks file exported from Chrome, Edge, Safari,
              Firefox, or any other browser that speaks the same format, or a
              JSON backup exported from Linkwarden. Folders and collections come
              across and links you already saved are left alone.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
          </CardContent>
        </Card>
        <Card className="w-full max-w-2xl shrink-0">
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
        <Card className="w-full max-w-2xl shrink-0">
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>
              Running Loomark{" "}
              <span className="font-mono text-foreground">{version}</span>.
              Check{" "}
              <Link
                className="underline underline-offset-4 hover:text-foreground"
                href="https://github.com/carlos-dubon/loomark/releases"
              >
                the releases page
              </Link>{" "}
              for what is new.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  )
}
