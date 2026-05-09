import { Redis } from "ioredis";
import { VentMessage, VentSession } from "./text.types";
import { VentPersistenceService } from "./text.persistence";

const CONTEXT_TTL_SECONDS = 60 * 60 * 6; // 6h — Redis is a cache; Postgres is source of truth
const MAX_CONTEXT_MESSAGES = 20;

export class VentContextService {
  private redis: Redis;
  private persistence: VentPersistenceService;

  constructor(redis: Redis, persistence: VentPersistenceService) {
    this.redis = redis;
    this.persistence = persistence;
  }

  private getKey(userId: string, sessionId: string): string {
    return `vent:ctx:${userId}:${sessionId}`;
  }

  /**
   * Get context for the LLM.
   * Redis hit → return immediately.
   * Redis miss → seed from Postgres (cross-session continuity).
   */
  async getContextMessages(
    userId: string,
    sessionId: string
  ): Promise<{ role: "user" | "assistant"; content: string }[]> {
    const key = this.getKey(userId, sessionId);
    const raw = await this.redis.get(key);

    if (raw) {
      const session = JSON.parse(raw) as VentSession;
      return session.messages.map(({ role, content }) => ({ role, content }));
    }

    // Cache miss — pull recent history from Postgres to seed Redis
    const pgMessages = await this.persistence.getRecentMessages(userId, MAX_CONTEXT_MESSAGES);

    if (pgMessages.length > 0) {
      const session: VentSession = {
        sessionId,
        userId,
        messages: pgMessages.map((m) => ({ ...m, timestamp: Date.now() })),
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      await this.redis.setex(key, CONTEXT_TTL_SECONDS, JSON.stringify(session));
    }

    return pgMessages;
  }

  async appendMessages(
    userId: string,
    sessionId: string,
    messages: VentMessage[]
  ): Promise<void> {
    const key = this.getKey(userId, sessionId);
    const raw = await this.redis.get(key);
    const now = Date.now();

    const session: VentSession = raw
      ? (JSON.parse(raw) as VentSession)
      : { sessionId, userId, messages: [], createdAt: now, lastActiveAt: now };

    session.messages.push(...messages);
    session.lastActiveAt = now;

    if (session.messages.length > MAX_CONTEXT_MESSAGES) {
      session.messages = session.messages.slice(-MAX_CONTEXT_MESSAGES);
    }

    await this.redis.setex(key, CONTEXT_TTL_SECONDS, JSON.stringify(session));
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    await this.redis.del(this.getKey(userId, sessionId));
  }
}