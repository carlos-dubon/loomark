-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "backgroundKind";
ALTER TABLE "User" DROP COLUMN IF EXISTS "backgroundPreset";

-- DropTable
DROP TABLE IF EXISTS "UserAsset";

-- DropEnum
DROP TYPE IF EXISTS "BackgroundKind";

-- DropEnum
DROP TYPE IF EXISTS "AssetKind";
