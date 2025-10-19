/*
  Warnings:

  - You are about to drop the column `preferred_support_type` on the `client_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `primary_objective` on the `client_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `prior_therapy_experience` on the `client_profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RelationShipStatus" AS ENUM ('SINGLE', 'IN_A_RELATIONSHIP', 'MARRIED', 'SEPERATED_DIVORCED', 'WIDOWED', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SeekingSupportFor" AS ENUM ('MYSELF', 'COUPLE', 'FAMILY');

-- AlterEnum
ALTER TYPE "Occupation" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "client_profiles" DROP COLUMN "preferred_support_type",
DROP COLUMN "primary_objective",
DROP COLUMN "prior_therapy_experience",
ADD COLUMN     "relation_ship_status" "RelationShipStatus",
ADD COLUMN     "seeking_support_for" "SeekingSupportFor";
