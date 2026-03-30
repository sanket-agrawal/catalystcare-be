-- DropIndex
DROP INDEX "public"."organizations_email_key";

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "email" DROP NOT NULL;
