-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "nativeLanguageId" INTEGER;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_nativeLanguageId_fkey" FOREIGN KEY ("nativeLanguageId") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
