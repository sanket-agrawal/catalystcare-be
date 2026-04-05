/*
  Warnings:

  - The values [RECURRING_PAYMENT_PENDING] on the enum `OrgStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrgStatus_new" AS ENUM ('PENDING_ONBOARDING', 'DISCUSSION_PENDING', 'PAYMENT_LINK_SENT', 'ACTIVE', 'SUSPENDED', 'EXPIRED');
ALTER TABLE "public"."organizations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "organizations" ALTER COLUMN "status" TYPE "OrgStatus_new" USING ("status"::text::"OrgStatus_new");
ALTER TYPE "OrgStatus" RENAME TO "OrgStatus_old";
ALTER TYPE "OrgStatus_new" RENAME TO "OrgStatus";
DROP TYPE "public"."OrgStatus_old";
ALTER TABLE "organizations" ALTER COLUMN "status" SET DEFAULT 'DISCUSSION_PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "notes" TEXT;
