-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "has_client_rescheduled_earlier" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_therapist_rescheduled_earlier" BOOLEAN NOT NULL DEFAULT false;
