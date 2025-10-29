-- CreateTable
CREATE TABLE "client_assessments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recent_feeling" TEXT,
    "crowded_with_worries" TEXT,
    "room_full_with_people" TEXT,
    "daily_task_feeling" TEXT,
    "thought_echo" TEXT,
    "decision" TEXT,
    "old_memories" TEXT,
    "loss_or_seperation" TEXT,
    "closest_relation_ship" TEXT,
    "saying_no" TEXT,
    "night_sleep" TEXT,
    "eating_pattern" TEXT,
    "heavy_life_cope" TEXT,
    "technology_view" TEXT,
    "self_image" TEXT,
    "future_perspective" TEXT,
    "sucidal_thoughts" TEXT,
    "halucinations" TEXT,
    "self_harm" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_assessments_user_id_key" ON "client_assessments"("user_id");

-- AddForeignKey
ALTER TABLE "client_assessments" ADD CONSTRAINT "client_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
