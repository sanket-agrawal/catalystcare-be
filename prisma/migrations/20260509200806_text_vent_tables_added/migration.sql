-- CreateTable
CREATE TABLE "vent_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vent_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vent_memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "messages_since_last_summary" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_vent_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vent_sessions_user_id_last_active_at_idx" ON "vent_sessions"("user_id", "last_active_at" DESC);

-- CreateIndex
CREATE INDEX "vent_messages_session_id_created_at_idx" ON "vent_messages"("session_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_vent_memories_user_id_key" ON "user_vent_memories"("user_id");

-- AddForeignKey
ALTER TABLE "vent_sessions" ADD CONSTRAINT "vent_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vent_messages" ADD CONSTRAINT "vent_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "vent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vent_memories" ADD CONSTRAINT "user_vent_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
