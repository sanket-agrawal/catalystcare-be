/*
  Warnings:

  - The values [PENDING] on the enum `CustomPlanRequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `contact_email` on the `custom_plan_requests` table. All the data in the column will be lost.
  - You are about to drop the column `contact_name` on the `custom_plan_requests` table. All the data in the column will be lost.
  - You are about to drop the column `contact_phone` on the `custom_plan_requests` table. All the data in the column will be lost.
  - You are about to drop the column `org_size` on the `custom_plan_requests` table. All the data in the column will be lost.
  - You are about to drop the column `sessions_needed` on the `custom_plan_requests` table. All the data in the column will be lost.
  - Added the required column `max_members` to the `custom_plan_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_paise` to the `custom_plan_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_duration` to the `custom_plan_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessions_count` to the `custom_plan_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CustomPlanRequestStatus_new" AS ENUM ('IN_DISCUSSION', 'PAYMENT_LINK_SENT', 'PLAN_CREATED', 'REJECTED');
ALTER TABLE "public"."custom_plan_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "custom_plan_requests" ALTER COLUMN "status" TYPE "CustomPlanRequestStatus_new" USING ("status"::text::"CustomPlanRequestStatus_new");
ALTER TYPE "CustomPlanRequestStatus" RENAME TO "CustomPlanRequestStatus_old";
ALTER TYPE "CustomPlanRequestStatus_new" RENAME TO "CustomPlanRequestStatus";
DROP TYPE "public"."CustomPlanRequestStatus_old";
ALTER TABLE "custom_plan_requests" ALTER COLUMN "status" SET DEFAULT 'IN_DISCUSSION';
COMMIT;

-- AlterEnum
ALTER TYPE "OrgStatus" ADD VALUE 'IN_DISCUSSION';

-- AlterTable
ALTER TABLE "custom_plan_requests" DROP COLUMN "contact_email",
DROP COLUMN "contact_name",
DROP COLUMN "contact_phone",
DROP COLUMN "org_size",
DROP COLUMN "sessions_needed",
ADD COLUMN     "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'ANNUAL',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "features" JSONB,
ADD COLUMN     "highlighted_text" TEXT,
ADD COLUMN     "max_members" INTEGER NOT NULL,
ADD COLUMN     "price_paise" INTEGER NOT NULL,
ADD COLUMN     "session_duration" INTEGER NOT NULL,
ADD COLUMN     "sessions_count" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'IN_DISCUSSION';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "org_size" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'PENDING_ONBOARDING';
