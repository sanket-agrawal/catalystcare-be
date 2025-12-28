-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "public"."testimonials_therapist_id_client_id_key";

-- AlterTable
ALTER TABLE "testimonials" ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "TestimonialStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "rating" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "testimonials_therapist_id_status_idx" ON "testimonials"("therapist_id", "status");

-- CreateIndex
CREATE INDEX "testimonials_client_id_idx" ON "testimonials"("client_id");
