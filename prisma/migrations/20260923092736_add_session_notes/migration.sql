-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('INDIVIDUAL', 'COUPLE', 'FAMILY', 'GROUP');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "session_notes_records" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "session_type" "SessionType" NOT NULL DEFAULT 'INDIVIDUAL',
    "mood_before" INTEGER,
    "mood_after" INTEGER,
    "presenting_concerns" TEXT,
    "session_summary" TEXT NOT NULL,
    "interventions_used" TEXT[],
    "key_observations" TEXT,
    "progress_notes" TEXT,
    "risk_assessment" "RiskLevel",
    "homework" TEXT,
    "next_session_goals" TEXT,
    "private_memo" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_notes_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_notes_records_booking_id_key" ON "session_notes_records"("booking_id");

-- CreateIndex
CREATE INDEX "session_notes_records_therapist_id_created_at_idx" ON "session_notes_records"("therapist_id", "created_at");

-- CreateIndex
CREATE INDEX "session_notes_records_booking_id_idx" ON "session_notes_records"("booking_id");

-- AddForeignKey
ALTER TABLE "session_notes_records" ADD CONSTRAINT "session_notes_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_notes_records" ADD CONSTRAINT "session_notes_records_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
