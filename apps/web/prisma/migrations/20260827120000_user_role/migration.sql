-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

-- Backfill: the oldest account owns the instance
UPDATE "User"
SET "role" = 'OWNER'
WHERE "id" = (
  SELECT "id" FROM "User" ORDER BY "createdAt" ASC, "id" ASC LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM "User" WHERE "role" = 'OWNER');
