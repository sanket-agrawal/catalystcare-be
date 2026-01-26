-- CreateEnum
CREATE TYPE "RescheduleStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "guidelines" JSONB,
ADD COLUMN     "target_audience" TEXT,
ADD COLUMN     "verified_by" TEXT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "reschedule_reason" TEXT,
ADD COLUMN     "reschedule_reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reschedule_reviewed_by" TEXT,
ADD COLUMN     "reschedule_status" "RescheduleStatus";
