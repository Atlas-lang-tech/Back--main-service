/*
  Warnings:

  - You are about to drop the column `number` on the `blokes_info` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `blokes_quizzes` table. All the data in the column will be lost.
  - Added the required column `order` to the `blokes_info` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `blokes_quizzes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "blokes_info" DROP COLUMN "number",
ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "blokes_quizzes" DROP COLUMN "number",
ADD COLUMN     "order" INTEGER NOT NULL;
