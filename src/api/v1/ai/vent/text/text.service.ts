import { Redis } from "ioredis";
import { VentMessage, VentSession } from "./text.types";
import { VentPersistenceService } from "./text.persistence";
import { decryptContent, encryptContent } from "../../../../../infrastructure/crypto/vent.crypto";

const CONTEXT_TTL_SECONDS = 60 * 60 * 6; // 6h — Redis is cache; Postgres is source of truth
const MAX_CONTEXT_MESSAGES = 20;
 
export class VentContextService {
  constructor(
    private redis: Redis,
    private persistence: VentPersistenceService
  ) {}
 
  private getKey(userId: string, sessionId: string): string {
    return `vent:ctx:${userId}:${sessionId}`;
  }
 
  /**
   * Get context for the LLM.
   * Redis hit  → return immediately.
   * Redis miss → seed from Postgres (cross-session continuity).
   */
  async getContextMessages(userId: string, sessionId: string) {
  const key = this.getKey(userId, sessionId);
  const raw = await this.redis.get(key);

  if (raw) {
    try {
      const session = JSON.parse(decryptContent(raw)) as VentSession;
      return session.messages.map(({ role, content }) => ({ role, content }));
    } catch {
      // Stale or malformed cache — delete and fall through to Postgres
      console.warn(`[VentContextService] Corrupt Redis key ${key}, re-seeding from Postgres`);
      await this.redis.del(key);
    }
  }

  // Cache miss or corrupt key — seed from Postgres
  const pgMessages = await this.persistence.getRecentMessages(userId, sessionId);

  if (pgMessages.length > 0) {
    const session: VentSession = {
      sessionId,
      userId,
      messages: pgMessages.map((m) => ({ ...m, timestamp: Date.now() })),
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    await this.redis.setex(key, CONTEXT_TTL_SECONDS, encryptContent(JSON.stringify(session)));
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
 
    const session: VentSession = (() => {
  if (!raw) return { sessionId, userId, messages: [], createdAt: now, lastActiveAt: now };
  try {
    return JSON.parse(decryptContent(raw)) as VentSession;
  } catch {
    console.warn(`[VentContextService] Corrupt Redis key on append, starting fresh`);
    return { sessionId, userId, messages: [], createdAt: now, lastActiveAt: now };
  }
})();
 
    session.messages.push(...messages);
    session.lastActiveAt = now;
 
    // Rolling window — keep only recent messages
    if (session.messages.length > MAX_CONTEXT_MESSAGES) {
      session.messages = session.messages.slice(-MAX_CONTEXT_MESSAGES);
    }
 
    await this.redis.setex(key, CONTEXT_TTL_SECONDS,  encryptContent(JSON.stringify(session)));
  }
 
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    await this.redis.del(this.getKey(userId, sessionId));
  }
}