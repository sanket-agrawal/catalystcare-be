/*
  Warnings:

  - The `target_audience` column on the `assessments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "assessments" DROP COLUMN "target_audience",
ADD COLUMN     "target_audience" JSONB;
