/*
  Warnings:

  - A unique constraint covering the columns `[slot_id,is_active]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."bookings_slot_id_key";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_slot_id_is_active_key" ON "bookings"("slot_id", "is_active");
