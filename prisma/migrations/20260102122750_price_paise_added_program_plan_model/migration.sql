/*
  Warnings:

  - Added the required column `price` to the `program_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "program_plans" ADD COLUMN     "price" INTEGER NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "programs" ALTER COLUMN "isActive" SET DEFAULT false;
