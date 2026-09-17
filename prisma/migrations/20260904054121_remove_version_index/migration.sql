/*
  Warnings:

  - You are about to drop the column `versionIndex` on the `Version` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Version_fileId_versionIndex_key";

-- AlterTable
ALTER TABLE "Version" DROP COLUMN "versionIndex";
