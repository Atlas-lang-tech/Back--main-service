/*
  Warnings:

  - A unique constraint covering the columns `[cid]` on the table `lessons` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cid` to the `lessons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "cid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "lessons_cid_key" ON "lessons"("cid");
