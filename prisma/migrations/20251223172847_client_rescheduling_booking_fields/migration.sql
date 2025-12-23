-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "rescheduled_at" TIMESTAMP(3),
ADD COLUMN     "rescheduled_from_id" TEXT;
