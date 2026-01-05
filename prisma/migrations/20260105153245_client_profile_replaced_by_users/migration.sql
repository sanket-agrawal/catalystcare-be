-- DropForeignKey
ALTER TABLE "public"."testimonials" DROP CONSTRAINT "testimonials_client_id_fkey";

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
