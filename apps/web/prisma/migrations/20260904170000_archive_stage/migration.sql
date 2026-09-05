CREATE TYPE "ArchiveStage" AS ENUM ('STARTING', 'LOADING', 'SETTLING', 'CAPTURING', 'SAVING');

ALTER TABLE "Archive" ADD COLUMN "stage" "ArchiveStage";

CREATE INDEX "Archive_userId_status_idx" ON "Archive"("userId", "status");
