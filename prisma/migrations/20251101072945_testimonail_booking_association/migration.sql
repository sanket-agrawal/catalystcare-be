/*
  Warnings:

  - You are about to drop the column `client_name` on the `testimonials` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[booking_id]` on the table `testimonials` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[therapist_id,client_id]` on the table `testimonials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `booking_id` to the `testimonials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client_id` to the `testimonials` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "tagline" TEXT;

-- AlterTable
ALTER TABLE "sub_categories" ADD COLUMN     "tagline" TEXT;

-- AlterTable
ALTER TABLE "testimonials" DROP COLUMN "client_name",
ADD COLUMN     "booking_id" TEXT NOT NULL,
ADD COLUMN     "client_id" TEXT NOT NULL,
ALTER COLUMN "text" DROP NOT NULL,
ALTER COLUMN "rating" SET DEFAULT 5;

-- CreateIndex
CREATE UNIQUE INDEX "testimonials_booking_id_key" ON "testimonials"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "testimonials_therapist_id_client_id_key" ON "testimonials"("therapist_id", "client_id");

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
