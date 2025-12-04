-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "client_last_read_at" TIMESTAMP(3),
ADD COLUMN     "therapist_last_read_at" TIMESTAMP(3);
