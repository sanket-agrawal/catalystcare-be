/*
  Warnings:

  - You are about to drop the column `booking_id` on the `availability_slots` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."availability_slots" DROP CONSTRAINT "availability_slots_booking_id_fkey";

-- DropIndex
DROP INDEX "public"."availability_slots_booking_id_key";

-- AlterTable
ALTER TABLE "availability_slots" DROP COLUMN "booking_id";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "availability_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
