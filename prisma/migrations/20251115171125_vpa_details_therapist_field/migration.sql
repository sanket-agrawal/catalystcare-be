-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN     "keyVersion" INTEGER,
ADD COLUMN     "upiNameAtBank" TEXT,
ADD COLUMN     "upiVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "upiVpaEnc" BYTEA,
ADD COLUMN     "upiVpaHash" VARCHAR(64),
ADD COLUMN     "upiVpaIv" BYTEA,
ADD COLUMN     "upiVpaTag" BYTEA;
