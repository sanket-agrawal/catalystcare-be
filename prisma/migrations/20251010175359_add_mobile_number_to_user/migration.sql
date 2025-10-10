-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_mobile_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mobile_number" TEXT;
