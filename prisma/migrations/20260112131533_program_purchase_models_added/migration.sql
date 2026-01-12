/*
  Warnings:

  - A unique constraint covering the columns `[program_purchase_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('SINGLE', 'PROGRAM');

-- CreateEnum
CREATE TYPE "ProgramPurchaseStatus" AS ENUM ('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "booking_type" "BookingType" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "program_purchase_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "program_purchase_id" TEXT;

-- CreateTable
CREATE TABLE "program_purchases" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "program_plan_id" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "usedSessions" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgramPurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTill" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_purchases_client_id_status_idx" ON "program_purchases"("client_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_program_purchase_id_key" ON "payments"("program_purchase_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_program_purchase_id_fkey" FOREIGN KEY ("program_purchase_id") REFERENCES "program_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_program_purchase_id_fkey" FOREIGN KEY ("program_purchase_id") REFERENCES "program_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
