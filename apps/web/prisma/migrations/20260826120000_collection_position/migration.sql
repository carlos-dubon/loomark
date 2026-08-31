-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill
UPDATE "Collection" AS c
SET "position" = ordered."rank"
FROM (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "parentId"
      ORDER BY "name" ASC
    ) - 1 AS "rank"
  FROM "Collection"
) AS ordered
WHERE c."id" = ordered."id";

-- CreateIndex
CREATE INDEX "Collection_userId_parentId_position_idx" ON "Collection"("userId", "parentId", "position");
