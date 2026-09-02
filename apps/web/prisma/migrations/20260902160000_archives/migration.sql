CREATE TYPE "ArchiveFormat" AS ENUM ('SCREENSHOT', 'WEBPAGE', 'PDF', 'MARKDOWN');

CREATE TYPE "ArchiveStatus" AS ENUM ('PENDING', 'RUNNING', 'READY', 'FAILED');

ALTER TABLE "User"
  ADD COLUMN "archiveScreenshot" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archiveWebpage" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archivePdf" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archiveMarkdown" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Archive" (
  "id" TEXT NOT NULL,
  "format" "ArchiveFormat" NOT NULL,
  "status" "ArchiveStatus" NOT NULL DEFAULT 'PENDING',
  "path" TEXT,
  "bytes" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "bookmarkId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Archive_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Archive_bookmarkId_format_key" ON "Archive"("bookmarkId", "format");

CREATE INDEX "Archive_userId_idx" ON "Archive"("userId");

CREATE INDEX "Archive_status_createdAt_idx" ON "Archive"("status", "createdAt");

ALTER TABLE "Archive" ADD CONSTRAINT "Archive_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "Bookmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Archive" ADD CONSTRAINT "Archive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
