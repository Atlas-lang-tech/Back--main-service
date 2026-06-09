-- AlterTable: add order column (temporary default 0 for existing rows)
ALTER TABLE "lessons" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Backfill: assign a contiguous, unique order per course based on existing id ordering
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "courseId" ORDER BY id) - 1 AS rn
  FROM "lessons"
)
UPDATE "lessons" l
SET "order" = o.rn
FROM ordered o
WHERE l.id = o.id;

-- CreateIndex: enforce unique order within a course
CREATE UNIQUE INDEX "lessons_courseId_order_key" ON "lessons"("courseId", "order");
