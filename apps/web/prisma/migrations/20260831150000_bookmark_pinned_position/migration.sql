-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN "pinnedPosition" INTEGER NOT NULL DEFAULT 0;

-- Backfill
UPDATE "Bookmark" AS b
SET "pinnedPosition" = ordered."rank"
FROM (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "createdAt" DESC
    ) - 1 AS "rank"
  FROM "Bookmark"
  WHERE "pinned" = true
) AS ordered
WHERE b."id" = ordered."id";

-- DropIndex
DROP INDEX IF EXISTS "Bookmark_userId_pinned_idx";

-- CreateIndex
CREATE INDEX "Bookmark_userId_pinned_pinnedPosition_idx" ON "Bookmark"("userId", "pinned", "pinnedPosition");
