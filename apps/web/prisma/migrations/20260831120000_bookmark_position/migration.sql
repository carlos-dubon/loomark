-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill
UPDATE "Bookmark" AS b
SET "position" = ordered."rank"
FROM (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "collectionId"
      ORDER BY "createdAt" DESC
    ) - 1 AS "rank"
  FROM "Bookmark"
) AS ordered
WHERE b."id" = ordered."id";

-- CreateIndex
CREATE INDEX "Bookmark_collectionId_position_idx" ON "Bookmark"("collectionId", "position");
