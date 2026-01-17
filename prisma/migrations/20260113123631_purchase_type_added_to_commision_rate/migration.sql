/*
  Warnings:

  - You are about to drop the column `purchase_type` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "commission_rates" ADD COLUMN     "purchase_type" "PurchaseType" NOT NULL DEFAULT 'SINGLE';

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "purchase_type";
