/*
  Warnings:

  - You are about to drop the `Assessment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssessmentOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssessmentQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AssessmentOption" DROP CONSTRAINT "AssessmentOption_question_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssessmentQuestion" DROP CONSTRAINT "AssessmentQuestion_assessment_id_fkey";

-- DropTable
DROP TABLE "public"."Assessment";

-- DropTable
DROP TABLE "public"."AssessmentOption";

-- DropTable
DROP TABLE "public"."AssessmentQuestion";

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "poster" TEXT,
    "slug" TEXT NOT NULL,
    "total_takers" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "assessment_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessments_slug_is_active_idx" ON "assessments"("slug", "is_active");

-- CreateIndex
CREATE INDEX "assessment_questions_is_active_order_text_idx" ON "assessment_questions"("is_active", "order", "text");

-- CreateIndex
CREATE INDEX "assessment_options_label_order_idx" ON "assessment_options"("label", "order");

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_options" ADD CONSTRAINT "assessment_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "assessment_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
