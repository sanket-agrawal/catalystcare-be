-- CreateEnum
CREATE TYPE "ProgramCadence" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'FLEXIBLE');

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "outcome" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_plans" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionsCount" INTEGER NOT NULL,
    "session_duration" INTEGER NOT NULL,
    "price_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "cadence" "ProgramCadence" NOT NULL,
    "recommended_gap_days" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "programs_therapist_id_isActive_idx" ON "programs"("therapist_id", "isActive");

-- CreateIndex
CREATE INDEX "program_plans_program_id_isActive_idx" ON "program_plans"("program_id", "isActive");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_plans" ADD CONSTRAINT "program_plans_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
