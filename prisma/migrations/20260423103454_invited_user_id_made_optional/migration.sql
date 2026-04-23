-- DropForeignKey
ALTER TABLE "public"."org_invitations" DROP CONSTRAINT "org_invitations_invited_by_user_id_fkey";

-- AlterTable
ALTER TABLE "org_invitations" ALTER COLUMN "invited_by_user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
