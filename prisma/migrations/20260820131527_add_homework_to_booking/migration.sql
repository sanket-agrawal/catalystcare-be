-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "homework" TEXT;

-- AlterTable
ALTER TABLE "client_profiles" ADD COLUMN     "ai_summary" TEXT,
ADD COLUMN     "ai_summary_updated_at" TIMESTAMP(3);
