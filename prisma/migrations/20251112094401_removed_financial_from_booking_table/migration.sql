/*
  Warnings:

  - You are about to drop the column `amount` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `amount_paise` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `commission_percent` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `gateway_fee_paise` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `gateway_percent` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `payout_amount_paise` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `platform_fee_paise` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `platform_percent` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "amount",
DROP COLUMN "amount_paise",
DROP COLUMN "commission_percent",
DROP COLUMN "gateway_fee_paise",
DROP COLUMN "gateway_percent",
DROP COLUMN "payout_amount_paise",
DROP COLUMN "platform_fee_paise",
DROP COLUMN "platform_percent";
