-- AlterTable
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "sharedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Collection_shareToken_key" ON "Collection"("shareToken");
