-- CreateEnum
CREATE TYPE "SeminarStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "seminars" (
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
    "status" "SeminarStatus" NOT NULL DEFAULT 'DRAFT',
    "meeting_link" TEXT,
    "meeting_provider" TEXT,
    "registration_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seminars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seminars_therapist_id_start_time_idx" ON "seminars"("therapist_id", "start_time");

-- AddForeignKey
ALTER TABLE "seminars" ADD CONSTRAINT "seminars_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
