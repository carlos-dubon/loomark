-- CreateEnum
CREATE TYPE "CollectionKind" AS ENUM ('USER', 'UNSORTED');

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "kind" "CollectionKind" NOT NULL DEFAULT 'USER';

-- Backfill one Unsorted collection per user
INSERT INTO "Collection" ("id", "name", "icon", "kind", "position", "parentId", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, 'Unsorted', NULL, 'UNSORTED', 0, NULL, "User"."id", NOW(), NOW()
FROM "User"
WHERE NOT EXISTS (
    SELECT 1 FROM "Collection"
    WHERE "Collection"."userId" = "User"."id" AND "Collection"."kind" = 'UNSORTED'
);

-- Move loose bookmarks into their owner's Unsorted collection
UPDATE "Bookmark"
SET "collectionId" = "Collection"."id"
FROM "Collection"
WHERE "Bookmark"."collectionId" IS NULL
  AND "Collection"."userId" = "Bookmark"."userId"
  AND "Collection"."kind" = 'UNSORTED';

-- AlterTable
ALTER TABLE "Bookmark" ALTER COLUMN "collectionId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_collectionId_fkey";

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Collection_userId_kind_idx" ON "Collection"("userId", "kind");

-- CreateIndex
CREATE INDEX "Bookmark_collectionId_position_idx" ON "Bookmark"("collectionId", "position");
