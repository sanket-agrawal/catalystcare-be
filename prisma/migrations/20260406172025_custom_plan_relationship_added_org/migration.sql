/*
  Warnings:

  - A unique constraint covering the columns `[custom_plan_request_id]` on the table `org_subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "org_subscriptions" ADD COLUMN     "custom_plan_request_id" TEXT,
ADD COLUMN     "default_sessions_per_member" INTEGER,
ADD COLUMN     "session_alloc_policy" TEXT NOT NULL DEFAULT 'POOL';

-- CreateIndex
CREATE UNIQUE INDEX "org_subscriptions_custom_plan_request_id_key" ON "org_subscriptions"("custom_plan_request_id");

-- AddForeignKey
ALTER TABLE "org_subscriptions" ADD CONSTRAINT "org_subscriptions_custom_plan_request_id_fkey" FOREIGN KEY ("custom_plan_request_id") REFERENCES "custom_plan_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
