/*
  Warnings:

  - You are about to drop the `seminars` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "WebinarStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."seminars" DROP CONSTRAINT "seminars_therapist_id_fkey";

-- DropTable
DROP TABLE "public"."seminars";

-- DropEnum
DROP TYPE "public"."SeminarStatus";

-- CreateTable
CREATE TABLE "webinars" (
    "id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "banner_url" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "capacity" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER NOT NULL,
    "price_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "WebinarStatus" NOT NULL DEFAULT 'DRAFT',
    "meeting_link" TEXT,
    "meeting_provider" TEXT,
    "registration_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webinars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webinars_therapist_id_start_time_idx" ON "webinars"("therapist_id", "start_time");

-- AddForeignKey
ALTER TABLE "webinars" ADD CONSTRAINT "webinars_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
