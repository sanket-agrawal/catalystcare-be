-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('EXTENSION_ONLY', 'PLATFORM', 'FULL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_type" "AccountType" NOT NULL DEFAULT 'EXTENSION_ONLY';

-- CreateTable
CREATE TABLE "extension_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extension_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "extension_usage_user_id_key" ON "extension_usage"("user_id");

-- AddForeignKey
ALTER TABLE "extension_usage" ADD CONSTRAINT "extension_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
