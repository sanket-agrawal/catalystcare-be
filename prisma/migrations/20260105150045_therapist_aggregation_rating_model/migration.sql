-- CreateTable
CREATE TABLE "therapist_ratings" (
    "therapist_id" TEXT NOT NULL,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_ratings" INTEGER NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_ratings_pkey" PRIMARY KEY ("therapist_id")
);

-- AddForeignKey
ALTER TABLE "therapist_ratings" ADD CONSTRAINT "therapist_ratings_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
