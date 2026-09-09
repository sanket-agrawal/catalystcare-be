/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `client_assessments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "client_assessments_user_id_key" ON "client_assessments"("user_id");
