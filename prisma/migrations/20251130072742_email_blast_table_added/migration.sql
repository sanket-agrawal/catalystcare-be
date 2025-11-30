-- CreateTable
CREATE TABLE "email_blast_logs" (
    "id" TEXT NOT NULL,
    "reason" TEXT,
    "carried_for" TEXT,
    "total_email_sent" INTEGER NOT NULL DEFAULT 0,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" TEXT NOT NULL,

    CONSTRAINT "email_blast_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "email_blast_logs" ADD CONSTRAINT "email_blast_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
