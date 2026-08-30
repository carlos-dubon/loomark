-- DropIndex
DROP INDEX "Bookmark_collectionId_position_idx";

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "icon",
DROP COLUMN "color";

-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "position";

-- CreateIndex
CREATE INDEX "Bookmark_collectionId_createdAt_idx" ON "Bookmark"("collectionId", "createdAt");
