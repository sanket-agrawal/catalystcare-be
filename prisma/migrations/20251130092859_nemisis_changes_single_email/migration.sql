/*
  Warnings:

  - You are about to drop the column `singleEmail` on the `email_blast_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "email_blast_logs" DROP COLUMN "singleEmail",
ADD COLUMN     "single_email" TEXT;
