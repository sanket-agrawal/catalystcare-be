/*
  Warnings:

  - Added the required column `content` to the `email_blast_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject` to the `email_blast_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "email_blast_logs" ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "subject" TEXT NOT NULL;
