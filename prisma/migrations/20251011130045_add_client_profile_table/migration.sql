-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('UNDER_18', 'AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_54', 'AGE_55_PLUS');

-- CreateEnum
CREATE TYPE "GenderIdentity" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "Occupation" AS ENUM ('STUDENT', 'WORKING_PROFESSIONAL', 'SELF_EMPLOYED', 'HOMEMAKER', 'RETIRED', 'NOT_WORKING');

-- CreateEnum
CREATE TYPE "PrimaryObjective" AS ENUM ('IMPROVE_EMOTIONAL_WELL_BEING', 'MANAGE_STRESS_OR_ANXIETY', 'BUILD_HEALTHIER_RELATIONSHIPS', 'IMPROVE_FOCUS_AND_MOTIVATION', 'EXPLORE_PERSONAL_GROWTH', 'NOT_SURE_JUST_WANT_TO_TALK');

-- CreateEnum
CREATE TYPE "PriorTherapyExperience" AS ENUM ('YES_CURRENTLY', 'YES_NOT_CURRENTLY', 'NO_FIRST_TIME');

-- CreateEnum
CREATE TYPE "PreferredSupportType" AS ENUM ('ONE_ON_ONE_COUNSELLING', 'GROUP_WORKSHOPS', 'SELF_HELP_RESOURCES', 'NOT_SURE_OPEN');

-- CreateTable
CREATE TABLE "ClientProfile" (
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

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_user_id_key" ON "ClientProfile"("user_id");

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
