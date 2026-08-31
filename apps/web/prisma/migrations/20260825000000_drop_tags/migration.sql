-- DropForeignKey
ALTER TABLE "_BookmarkTags" DROP CONSTRAINT "_BookmarkTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_BookmarkTags" DROP CONSTRAINT "_BookmarkTags_B_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_userId_fkey";

-- DropTable
DROP TABLE "_BookmarkTags";

-- DropTable
DROP TABLE "Tag";
