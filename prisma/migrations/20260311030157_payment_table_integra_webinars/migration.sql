/*
  Warnings:

  - You are about to drop the column `amount` on the `webinar_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `amount_paise` on the `webinar_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `webinar_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `razorpay_order_id` on the `webinar_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `razorpay_payment_id` on the `webinar_registrations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[webinar_registration_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "BookingType" ADD VALUE 'WEBINAR';

-- AlterEnum
ALTER TYPE "PurchaseType" ADD VALUE 'WEBINAR';

-- DropIndex
DROP INDEX "public"."webinar_registrations_razorpay_order_id_idx";

-- DropIndex
DROP INDEX "public"."webinar_registrations_razorpay_order_id_key";

-- DropIndex
DROP INDEX "public"."webinar_registrations_razorpay_payment_id_key";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "webinar_registration_id" TEXT;

-- AlterTable
ALTER TABLE "webinar_registrations" DROP COLUMN "amount",
DROP COLUMN "amount_paise",
DROP COLUMN "currency",
DROP COLUMN "razorpay_order_id",
DROP COLUMN "razorpay_payment_id",
ADD COLUMN     "paymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_webinar_registration_id_key" ON "payments"("webinar_registration_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_webinar_registration_id_fkey" FOREIGN KEY ("webinar_registration_id") REFERENCES "webinar_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
