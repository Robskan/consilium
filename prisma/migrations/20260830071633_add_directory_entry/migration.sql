-- DropIndex
DROP INDEX "Version_fileId_version_idx";

-- CreateTable
CREATE TABLE "DirectoryEntry" (
    "discordId" TEXT NOT NULL,
    "positionRaw" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectoryEntry_pkey" PRIMARY KEY ("discordId")
);
