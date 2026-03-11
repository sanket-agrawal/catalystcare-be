-- CreateEnum
CREATE TYPE "WebinarRegistrationStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "webinar_registrations" (
    "id" TEXT NOT NULL,
    "webinar_id" TEXT NOT NULL,
    "guest_name" TEXT NOT NULL,
    "guest_email" TEXT NOT NULL,
    "guest_phone" TEXT,
    "status" "WebinarRegistrationStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "amount" INTEGER NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "confirmation_sent_at" TIMESTAMP(3),
    "confirmation_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webinar_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webinar_registrations_razorpay_order_id_key" ON "webinar_registrations"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_registrations_razorpay_payment_id_key" ON "webinar_registrations"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "webinar_registrations_webinar_id_status_idx" ON "webinar_registrations"("webinar_id", "status");

-- CreateIndex
CREATE INDEX "webinar_registrations_guest_email_webinar_id_idx" ON "webinar_registrations"("guest_email", "webinar_id");

-- CreateIndex
CREATE INDEX "webinar_registrations_razorpay_order_id_idx" ON "webinar_registrations"("razorpay_order_id");

-- AddForeignKey
ALTER TABLE "webinar_registrations" ADD CONSTRAINT "webinar_registrations_webinar_id_fkey" FOREIGN KEY ("webinar_id") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
