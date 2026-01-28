-- AlterTable
ALTER TABLE "assessment_questions" ADD COLUMN     "isReverse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zone_id" TEXT;

-- AlterTable
ALTER TABLE "assessment_submissions" ADD COLUMN     "primary_zone" TEXT,
ADD COLUMN     "scores" JSONB;

-- CreateTable
CREATE TABLE "assessment_zones" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxRawScore" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "assessment_zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_zones_assessment_id_order_idx" ON "assessment_zones"("assessment_id", "order");

-- AddForeignKey
ALTER TABLE "assessment_zones" ADD CONSTRAINT "assessment_zones_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "assessment_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
