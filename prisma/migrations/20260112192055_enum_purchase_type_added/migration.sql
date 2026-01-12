-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('SINGLE', 'PROGRAM');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "purchase_type" "PurchaseType" NOT NULL DEFAULT 'SINGLE';
