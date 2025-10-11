/*
  Warnings:

  - You are about to drop the `ClientProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ClientProfile" DROP CONSTRAINT "ClientProfile_user_id_fkey";

-- DropTable
DROP TABLE "public"."ClientProfile";

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "genderIdentity" "GenderIdentity" NOT NULL,
    "occupation" "Occupation" NOT NULL,
    "primaryObjective" "PrimaryObjective" NOT NULL,
    "priorTherapyExperience" "PriorTherapyExperience" NOT NULL,
    "preferredSupportType" "PreferredSupportType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_user_id_key" ON "client_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
