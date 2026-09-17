-- AlterTable
ALTER TABLE "DirectoryEntry" ALTER COLUMN "lastUpdated" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Version" ADD COLUMN     "mimeType" TEXT NULL;
UPDATE "Version" SET "mimeType" = 'application/octet-stream' WHERE "mimeType" IS NULL;
ALTER TABLE "Version" ALTER COLUMN "mimeType" SET NOT NULL;