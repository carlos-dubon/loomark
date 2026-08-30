-- Guarded because an earlier build of this migration shipped under a different
-- name; the guards let a database that already ran that one roll forward.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AssetKind" AS ENUM ('BACKGROUND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "BackgroundKind" AS ENUM ('NONE', 'STATIC', 'SHADER', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themePreset" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "backgroundKind" "BackgroundKind" NOT NULL DEFAULT 'SHADER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "backgroundPreset" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL DEFAULT 'BACKGROUND',
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserAsset_userId_kind_key" ON "UserAsset"("userId", "kind");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "UserAsset" ADD CONSTRAINT "UserAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
