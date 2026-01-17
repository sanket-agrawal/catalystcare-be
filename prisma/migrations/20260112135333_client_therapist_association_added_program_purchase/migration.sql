-- AddForeignKey
ALTER TABLE "program_purchases" ADD CONSTRAINT "program_purchases_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_purchases" ADD CONSTRAINT "program_purchases_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
