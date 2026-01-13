-- AddForeignKey
ALTER TABLE "program_purchases" ADD CONSTRAINT "program_purchases_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_purchases" ADD CONSTRAINT "program_purchases_program_plan_id_fkey" FOREIGN KEY ("program_plan_id") REFERENCES "program_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
