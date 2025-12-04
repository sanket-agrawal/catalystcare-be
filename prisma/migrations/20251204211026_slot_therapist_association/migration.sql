-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
