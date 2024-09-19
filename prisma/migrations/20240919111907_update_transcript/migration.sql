/*
  Warnings:

  - You are about to drop the column `transcriptionId` on the `Transcript` table. All the data in the column will be lost.
  - You are about to drop the column `videoPath` on the `Transcript` table. All the data in the column will be lost.
  - Added the required column `text` to the `Transcript` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transcript" DROP COLUMN "transcriptionId",
DROP COLUMN "videoPath",
ADD COLUMN     "text" TEXT NOT NULL;
