/*
  Warnings:

  - A unique constraint covering the columns `[google_auth_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'HYBRID');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "google_auth_id" TEXT,
ADD COLUMN     "google_email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_auth_id_key" ON "users"("google_auth_id");
