/*
  Warnings:

  - A unique constraint covering the columns `[cid]` on the table `courses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cid` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "cid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "courses_cid_key" ON "courses"("cid");
