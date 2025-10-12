/*
  Warnings:

  - You are about to drop the column `ageGroup` on the `client_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `genderIdentity` on the `client_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredSupportType` on the `client_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `primaryObjective` on the `client_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `priorTherapyExperience` on the `client_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "client_profiles" DROP COLUMN "ageGroup",
DROP COLUMN "genderIdentity",
DROP COLUMN "preferredSupportType",
DROP COLUMN "primaryObjective",
DROP COLUMN "priorTherapyExperience",
ADD COLUMN     "age_group" "AgeGroup",
ADD COLUMN     "gender_identity" "GenderIdentity",
ADD COLUMN     "preferred_support_type" "PreferredSupportType",
ADD COLUMN     "primary_objective" "PrimaryObjective",
ADD COLUMN     "prior_therapy_experience" "PriorTherapyExperience",
ALTER COLUMN "occupation" DROP NOT NULL;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TherapistCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TherapistCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TherapistSubCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TherapistSubCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "_TherapistCategories_B_index" ON "_TherapistCategories"("B");

-- CreateIndex
CREATE INDEX "_TherapistSubCategories_B_index" ON "_TherapistSubCategories"("B");

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TherapistCategories" ADD CONSTRAINT "_TherapistCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TherapistCategories" ADD CONSTRAINT "_TherapistCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TherapistSubCategories" ADD CONSTRAINT "_TherapistSubCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TherapistSubCategories" ADD CONSTRAINT "_TherapistSubCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
