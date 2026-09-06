DROP TABLE "Archive";

DROP TYPE "ArchiveStage";

DROP TYPE "ArchiveStatus";

DROP TYPE "ArchiveFormat";

ALTER TABLE "User"
  DROP COLUMN "archiveScreenshot",
  DROP COLUMN "archiveWebpage",
  DROP COLUMN "archivePdf",
  DROP COLUMN "archiveMarkdown";
