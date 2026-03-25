-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_lvls" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "languageId" INTEGER NOT NULL,

    CONSTRAINT "language_lvls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "languageId" INTEGER NOT NULL,
    "languageLvlId" INTEGER NOT NULL,
    "categoryId" INTEGER,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blokes_info" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "lessonId" INTEGER NOT NULL,

    CONSTRAINT "blokes_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blokes_quizzes" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "lessonId" INTEGER NOT NULL,

    CONSTRAINT "blokes_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_one_true_choice" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "options" TEXT[],
    "correctAnswer" TEXT NOT NULL,
    "blockQuizId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_one_true_choice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_fill_in_blank" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "blockQuizId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_fill_in_blank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_manual_answer" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "blockQuizId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_manual_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_build_sentence" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "words" TEXT[],
    "correctOrder" INTEGER[],
    "blockQuizId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_build_sentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_translation" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "translateTo" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "blockQuizId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_matching" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "pairs" JSONB NOT NULL,
    "blockQuizId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_matching_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_dialogue" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "dialogue" JSONB NOT NULL,
    "blockQuizId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_dialogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_dialogue_questions" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "quizDialogueId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_dialogue_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_rephrasing" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "blockQuizId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_rephrasing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes_error_correction" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "errorText" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "blockQuizId" INTEGER NOT NULL,

    CONSTRAINT "quizzes_error_correction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "language_lvls_name_key" ON "language_lvls"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- AddForeignKey
ALTER TABLE "language_lvls" ADD CONSTRAINT "language_lvls_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_languageLvlId_fkey" FOREIGN KEY ("languageLvlId") REFERENCES "language_lvls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blokes_info" ADD CONSTRAINT "blokes_info_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blokes_quizzes" ADD CONSTRAINT "blokes_quizzes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_one_true_choice" ADD CONSTRAINT "quizzes_one_true_choice_blockQuizId_fkey" FOREIGN KEY ("blockQuizId") REFERENCES "blokes_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_fill_in_blank" ADD CONSTRAINT "quizzes_fill_in_blank_blockQuizId_fkey" FOREIGN KEY ("blockQuizId") REFERENCES "blokes_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_manual_answer" ADD CONSTRAINT "quizzes_manual_answer_blockQuizId_fkey" FOREIGN KEY ("blockQuizId") REFERENCES "blokes_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_build_sentence" ADD CONSTRAINT "quizzes_build_sentence_blockQuizId_fkey" FOREIGN KEY ("blockQuizId") REFERENCES "blokes_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_translation" ADD CONSTRAINT "quizzes_translation_blockQuizId_fkey" FOREIGN KEY ("blockQuizId") REFERENCES "blokes_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_matching" ADD CONSTRAINT "quizzes_matching_blockQuizId_fkey" FOREIGN KEY ("blockQuizId") REFERENCES "blokes_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_dialogue" ADD CONSTRAINT "quizzes_dialogue_blockQuizId_fkey" FOREIGN KEY ("blockQuizId") REFERENCES "blokes_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_dialogue_questions" ADD CONSTRAINT "quizzes_dialogue_questions_quizDialogueId_fkey" FOREIGN KEY ("quizDialogueId") REFERENCES "quizzes_dialogue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_rephrasing" ADD CONSTRAINT "quizzes_rephrasing_blockQuizId_fkey" FOREIGN KEY ("blockQuizId") REFERENCES "blokes_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes_error_correction" ADD CONSTRAINT "quizzes_error_correction_blockQuizId_fkey" FOREIGN KEY ("blockQuizId") REFERENCES "blokes_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
