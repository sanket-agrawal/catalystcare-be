import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import {callGroq} from "../../../../../infrastructure/groq/index";

const SUMMARY_TRIGGER_EVERY_N = 10; // regenerate summary every 10 new messages

const SUMMARY_SYSTEM_PROMPT = `You are a clinical assistant helping a mental wellness AI maintain a compassionate memory of a user.

Given a conversation history, extract a concise psychological profile — key emotional themes, recurring stressors, relationship dynamics, and any context that would help a future conversation feel continuous and caring.

Rules:
- Write in third person ("The user...")
- Be specific, not generic. "User stressed about father's expectations around engineering career" not "User has family stress"
- Max 200 words
- If an existing summary is provided, MERGE new insights with it — don't discard old context
- Only include emotionally meaningful information, not small talk
- Output plain text, no bullet points, no headers`;

export class VentPersistenceService {
  constructor(private prisma: PrismaClient) {}
 
  /**
   * Persist a user+assistant message pair to Postgres.
   * Increments the summary counter and triggers re-summarization when threshold is hit.
   */
  async persistMessages(
    userId: string,
    sessionId: string,
    userMessage: string,
    assistantReply: string
  ): Promise<void> {
    // Upsert the session row
    await this.prisma.ventSession.upsert({
      where: { id: sessionId },
      create: { id: sessionId, userId },
      update: { lastActiveAt: new Date(), isActive: true },
    });
 
    // Insert both messages in one query
    await this.prisma.ventMessage.createMany({
      data: [
        { sessionId, role: "user", content: userMessage },
        { sessionId, role: "assistant", content: assistantReply },
      ],
    });
 
    // Increment counter; upsert creates the row on first message
    const memory = await this.prisma.userVentMemory.upsert({
      where: { userId },
      create: { userId, summary: "", messagesSinceLastSummary: 2 },
      update: { messagesSinceLastSummary: { increment: 2 } },
    });
 
    if (memory.messagesSinceLastSummary >= SUMMARY_TRIGGER_EVERY_N) {
      // Fire-and-forget — don't block the HTTP response
      this.regenerateSummary(userId).catch((err) =>
        console.error("[VentPersistenceService] regenerateSummary error:", err)
      );
    }
  }
 
  /**
   * Returns the LLM-generated user memory summary, or null if none exists yet.
   */
  async getUserSummary(userId: string): Promise<string | null> {
    const memory = await this.prisma.userVentMemory.findUnique({
      where: { userId },
      select: { summary: true },
    });
    // Return null if empty string (no summary generated yet)
    return memory?.summary || null;
  }
 
  /**
   * Fetches the most recent `limit` messages across all sessions for a user.
   * Used to seed Redis on a cache miss (cross-session continuity).
   */
  async getRecentMessages(
    userId: string,
    limit = 20
  ): Promise<{ role: "user" | "assistant"; content: string }[]> {
    const messages = await this.prisma.ventMessage.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { role: true, content: true },
    });
 
    // Reverse so messages are oldest-first (correct order for LLM context)
    return messages
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }
 
  /**
   * Calls Groq to regenerate the rolling summary from recent message history.
   * Merges with existing summary so no context is lost across summarization runs.
   */
  private async regenerateSummary(userId: string): Promise<void> {
    const [recentMessages, currentMemory] = await Promise.all([
      this.getRecentMessages(userId, 40),
      this.prisma.userVentMemory.findUnique({ where: { userId } }),
    ]);
 
    if (!recentMessages.length) return;
 
    const conversationText = recentMessages
      .map((m) => `${m.role === "user" ? "User" : "Manasi"}: ${m.content}`)
      .join("\n");
 
    const userPrompt = currentMemory?.summary
      ? `Existing summary:\n${currentMemory.summary}\n\nNew conversation to incorporate:\n${conversationText}`
      : `Conversation:\n${conversationText}`;
 
    const newSummary = await callGroq({
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
      // No json_object here — summary is plain text
    });
 
    if (!newSummary.trim()) return;
 
    await this.prisma.userVentMemory.update({
      where: { userId },
      data: {
        summary: newSummary.trim(),
        messagesSinceLastSummary: 0,
      },
    });
  }
}