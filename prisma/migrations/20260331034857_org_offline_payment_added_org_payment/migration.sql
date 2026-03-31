-- AlterTable
ALTER TABLE "org_payments" ADD COLUMN     "marked_paid_at" TIMESTAMP(3),
ADD COLUMN     "marked_paid_by_admin_id" TEXT,
ADD COLUMN     "offline_note" TEXT,
ADD COLUMN     "offline_reference" TEXT;

-- AddForeignKey
ALTER TABLE "org_payments" ADD CONSTRAINT "org_payments_marked_paid_by_admin_id_fkey" FOREIGN KEY ("marked_paid_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
