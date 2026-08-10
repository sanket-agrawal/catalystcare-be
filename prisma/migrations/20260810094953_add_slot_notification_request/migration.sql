-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "is_visible_on_website" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "slot_notification_requests" (
    "id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" TEXT NOT NULL,
    "user_name" TEXT,
    "is_notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slot_notification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "slot_notification_requests_therapist_id_is_notified_idx" ON "slot_notification_requests"("therapist_id", "is_notified");

-- CreateIndex
CREATE INDEX "slot_notification_requests_user_id_idx" ON "slot_notification_requests"("user_id");

-- AddForeignKey
ALTER TABLE "slot_notification_requests" ADD CONSTRAINT "slot_notification_requests_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_notification_requests" ADD CONSTRAINT "slot_notification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
