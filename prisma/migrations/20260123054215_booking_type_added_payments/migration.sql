-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "booking_type" "BookingType" NOT NULL DEFAULT 'SINGLE';
