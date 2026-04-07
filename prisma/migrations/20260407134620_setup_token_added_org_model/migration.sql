/*
  Warnings:

  - A unique constraint covering the columns `[setup_token]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "setup_completed_at" TIMESTAMP(3),
ADD COLUMN     "setup_token" TEXT,
ADD COLUMN     "setup_token_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_setup_token_key" ON "organizations"("setup_token");
