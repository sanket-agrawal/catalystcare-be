-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "calendar_event_id" TEXT,
ADD COLUMN     "meeting_link" TEXT,
ADD COLUMN     "meeting_provider" TEXT;

-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "calendar_id" TEXT,
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "google_email" TEXT,
ADD COLUMN     "google_user_id" TEXT,
ADD COLUMN     "refresh_token" TEXT;
