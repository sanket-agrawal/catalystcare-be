/*
  Warnings:

  - You are about to drop the column `user_email` on the `slot_notification_requests` table. All the data in the column will be lost.
  - You are about to drop the column `user_name` on the `slot_notification_requests` table. All the data in the column will be lost.
  - Made the column `user_id` on table `slot_notification_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."slot_notification_requests" DROP CONSTRAINT "slot_notification_requests_user_id_fkey";

-- AlterTable
ALTER TABLE "slot_notification_requests" DROP COLUMN "user_email",
DROP COLUMN "user_name",
ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "slot_notification_requests" ADD CONSTRAINT "slot_notification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
