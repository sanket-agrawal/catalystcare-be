-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "program_plan_id" TEXT;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_program_plan_id_fkey" FOREIGN KEY ("program_plan_id") REFERENCES "program_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
