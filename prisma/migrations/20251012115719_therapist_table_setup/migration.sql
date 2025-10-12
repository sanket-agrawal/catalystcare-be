/*
  Warnings:

  - You are about to drop the column `education_docs` on the `therapist_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `experience_years` on the `therapist_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `medical_docs` on the `therapist_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `therapist_profiles` table. All the data in the column will be lost.
  - Added the required column `current_workspace` to the `therapist_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `graduation_year` to the `therapist_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `highest_qualification` to the `therapist_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `license_number` to the `therapist_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licensing_authority` to the `therapist_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `practice_type` to the `therapist_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `professional_title` to the `therapist_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year_of_experience` to the `therapist_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "therapist_profiles" DROP COLUMN "education_docs",
DROP COLUMN "experience_years",
DROP COLUMN "medical_docs",
DROP COLUMN "specialization",
ADD COLUMN     "address_proof" TEXT,
ADD COLUMN     "bgv_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currency" TEXT DEFAULT 'INR',
ADD COLUMN     "current_workspace" TEXT NOT NULL,
ADD COLUMN     "degree_certificate" TEXT,
ADD COLUMN     "ethical_and_confidentiality_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "geniune_document_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "government_id" TEXT,
ADD COLUMN     "graduation_year" TEXT NOT NULL,
ADD COLUMN     "highest_qualification" TEXT NOT NULL,
ADD COLUMN     "language_spoken" TEXT[],
ADD COLUMN     "license_number" TEXT NOT NULL,
ADD COLUMN     "licensing_authority" TEXT NOT NULL,
ADD COLUMN     "practice_type" TEXT NOT NULL,
ADD COLUMN     "professional_title" TEXT NOT NULL,
ADD COLUMN     "registration_certificate" TEXT,
ADD COLUMN     "service_and_privacy_policy_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "session_fee" DECIMAL(65,30),
ADD COLUMN     "success_stories" TEXT,
ADD COLUMN     "year_of_experience" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_photo" TEXT;
