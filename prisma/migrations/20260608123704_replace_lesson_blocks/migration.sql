-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('MARKDOWN', 'ONE_TRUE_CHOICE', 'FILL_IN_BLANK', 'MANUAL_ANSWER', 'BUILD_SENTENCE', 'TRANSLATION', 'MATCHING', 'DIALOGUE', 'REPHRASING', 'ERROR_CORRECTION');

-- DropForeignKey
ALTER TABLE "blokes_info" DROP CONSTRAINT "blokes_info_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "blokes_quizzes" DROP CONSTRAINT "blokes_quizzes_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_one_true_choice" DROP CONSTRAINT "quizzes_one_true_choice_blockQuizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_fill_in_blank" DROP CONSTRAINT "quizzes_fill_in_blank_blockQuizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_manual_answer" DROP CONSTRAINT "quizzes_manual_answer_blockQuizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_build_sentence" DROP CONSTRAINT "quizzes_build_sentence_blockQuizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_translation" DROP CONSTRAINT "quizzes_translation_blockQuizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_matching" DROP CONSTRAINT "quizzes_matching_blockQuizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_dialogue" DROP CONSTRAINT "quizzes_dialogue_blockQuizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_dialogue_questions" DROP CONSTRAINT "quizzes_dialogue_questions_quizDialogueId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_rephrasing" DROP CONSTRAINT "quizzes_rephrasing_blockQuizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes_error_correction" DROP CONSTRAINT "quizzes_error_correction_blockQuizId_fkey";

-- DropTable
DROP TABLE "blokes_info";

-- DropTable
DROP TABLE "blokes_quizzes";

-- DropTable
DROP TABLE "quizzes_one_true_choice";

-- DropTable
DROP TABLE "quizzes_fill_in_blank";

-- DropTable
DROP TABLE "quizzes_manual_answer";

-- DropTable
DROP TABLE "quizzes_build_sentence";

-- DropTable
DROP TABLE "quizzes_translation";

-- DropTable
DROP TABLE "quizzes_matching";

-- DropTable
DROP TABLE "quizzes_dialogue";

-- DropTable
DROP TABLE "quizzes_dialogue_questions";

-- DropTable
DROP TABLE "quizzes_rephrasing";

-- DropTable
DROP TABLE "quizzes_error_correction";

-- CreateTable
CREATE TABLE "blocks" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "BlockType" NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocks_lessonId_order_key" ON "blocks"("lessonId", "order");

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
