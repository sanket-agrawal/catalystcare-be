/*
  Warnings:

  - Added the required column `price` to the `custom_plan_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "custom_plan_requests" ADD COLUMN     "price" INTEGER NOT NULL;
