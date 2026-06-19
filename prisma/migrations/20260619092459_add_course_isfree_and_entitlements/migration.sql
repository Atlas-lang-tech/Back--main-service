-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "entitlements" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_userId_courseId_key" ON "entitlements"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
