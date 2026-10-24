/*
  Warnings:

  - The values [FAMILY,GROUP] on the enum `SessionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `homework` on the `session_notes_records` table. All the data in the column will be lost.
  - You are about to drop the column `private_memo` on the `session_notes_records` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SessionType_new" AS ENUM ('INDIVIDUAL', 'COUPLE');
ALTER TABLE "public"."session_notes_records" ALTER COLUMN "session_type" DROP DEFAULT;
ALTER TABLE "session_notes_records" ALTER COLUMN "session_type" TYPE "SessionType_new" USING ("session_type"::text::"SessionType_new");
ALTER TYPE "SessionType" RENAME TO "SessionType_old";
ALTER TYPE "SessionType_new" RENAME TO "SessionType";
DROP TYPE "public"."SessionType_old";
ALTER TABLE "session_notes_records" ALTER COLUMN "session_type" SET DEFAULT 'INDIVIDUAL';
COMMIT;

-- AlterTable
ALTER TABLE "session_notes_records" DROP COLUMN "homework",
DROP COLUMN "private_memo";
