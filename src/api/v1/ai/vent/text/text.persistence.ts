import { PrismaClient } from "@prisma/client";
import { callGroq } from "../../../../../infrastructure/groq/index";
import { VentSessionPreview } from "./text.types";

const SUMMARY_TRIGGER_EVERY_N = 10;

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

  // ─── Session Management ────────────────────────────────────────

  async createSession(userId: string): Promise<{ sessionId: string }> {
    const session = await this.prisma.ventSession.create({
      data: { userId },
    });
    return { sessionId: session.id };
  }

  async getUserSessions(userId: string): Promise<VentSessionPreview[]> {
    const sessions = await this.prisma.ventSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: "desc" },
      take: 30,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,    // first message = title
          select: { content: true, role: true },
        },
        _count: { select: { messages: true } },
      },
    });

    // Fetch last message separately for preview
    const sessionIds = sessions.map((s) => s.id);
    const lastMessages = await this.prisma.ventMessage.findMany({
      where: {
        sessionId: { in: sessionIds },
        role: "assistant", // show last AI reply as preview
      },
      orderBy: { createdAt: "desc" },
      distinct: ["sessionId"],
      select: { sessionId: true, content: true },
    });

    const lastMsgMap = new Map(lastMessages.map((m) => [m.sessionId, m.content]));

    return sessions.map((s) => {
      const firstMsg = s.messages[0]?.content ?? "New conversation";
      return {
        sessionId: s.id,
        title: firstMsg.slice(0, 60) + (firstMsg.length > 60 ? "..." : ""),
        preview: (lastMsgMap.get(s.id) ?? "").slice(0, 80),
        lastActiveAt: s.lastActiveAt,
        startedAt: s.startedAt,
        messageCount: s._count.messages,
      };
    });
  }

  async getSessionMessages(
    userId: string,
    sessionId: string
  ): Promise<{ role: string; content: string; createdAt: Date }[]> {
    // Verify session belongs to user
    const session = await this.prisma.ventSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new Error("Session not found");

    return this.prisma.ventMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true, createdAt: true },
    });
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    // Soft delete — keeps data, removes from user's list
    await this.prisma.ventSession.updateMany({
      where: { id: sessionId, userId },
      data: { isActive: false },
    });
  }

  async verifySessionOwner(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.prisma.ventSession.findFirst({
      where: { id: sessionId, userId, isActive: true },
      select: { id: true },
    });
    return !!session;
  }

  // ─── Messaging ─────────────────────────────────────────────────

  async persistMessages(
    userId: string,
    sessionId: string,
    userMessage: string,
    assistantReply: string
  ): Promise<void> {
    await this.prisma.ventSession.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });

    await this.prisma.ventMessage.createMany({
      data: [
        { sessionId, role: "user", content: userMessage },
        { sessionId, role: "assistant", content: assistantReply },
      ],
    });

    const memory = await this.prisma.userVentMemory.upsert({
      where: { userId },
      create: { userId, summary: "", messagesSinceLastSummary: 2 },
      update: { messagesSinceLastSummary: { increment: 2 } },
    });

    if (memory.messagesSinceLastSummary >= SUMMARY_TRIGGER_EVERY_N) {
      this.regenerateSummary(userId).catch((err) =>
        console.error("[VentPersistenceService] regenerateSummary error:", err)
      );
    }
  }

  async getUserSummary(userId: string): Promise<string | null> {
    const memory = await this.prisma.userVentMemory.findUnique({
      where: { userId },
      select: { summary: true },
    });
    return memory?.summary || null;
  }

  async getRecentMessages(
    userId: string,
    sessionId: string,   // scope to current session only
    limit = 20
  ): Promise<{ role: "user" | "assistant"; content: string }[]> {
    const messages = await this.prisma.ventMessage.findMany({
      where: { sessionId, session: { userId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { role: true, content: true },
    });

    return messages
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }

  private async regenerateSummary(userId: string): Promise<void> {
    // Pull from all sessions for the summary (cross-session memory)
    const recentMessages = await this.prisma.ventMessage.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { role: true, content: true },
    });

    if (!recentMessages.length) return;

    const currentMemory = await this.prisma.userVentMemory.findUnique({
      where: { userId },
    });

    const conversationText = recentMessages
      .reverse()
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
    });

    if (!newSummary.trim()) return;

    await this.prisma.userVentMemory.update({
      where: { userId },
      data: { summary: newSummary.trim(), messagesSinceLastSummary: 0 },
    });
  }
}