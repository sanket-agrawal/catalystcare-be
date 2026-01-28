/*
  Warnings:

  - You are about to drop the column `isReverse` on the `assessment_questions` table. All the data in the column will be lost.
  - You are about to drop the column `maxRawScore` on the `assessment_zones` table. All the data in the column will be lost.
  - Added the required column `max_raw_score` to the `assessment_zones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assessment_questions" DROP COLUMN "isReverse",
ADD COLUMN     "is_reverse" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "assessment_zones" DROP COLUMN "maxRawScore",
ADD COLUMN     "max_raw_score" INTEGER NOT NULL;
