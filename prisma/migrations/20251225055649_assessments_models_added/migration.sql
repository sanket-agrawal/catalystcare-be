-- CreateTable
CREATE TABLE "Assessment" (
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

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentOption" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "AssessmentOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentOption" ADD CONSTRAINT "AssessmentOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
