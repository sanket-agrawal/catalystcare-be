import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

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
  private prisma: PrismaClient;
  private llmClient: OpenAI;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.llmClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  /**
   * Persist a message pair (user + assistant) to Postgres.
   * Also increments the summary counter and triggers re-summarization if needed.
   */
  async persistMessages(
    userId: string,
    sessionId: string,
    userMessage: string,
    assistantReply: string
  ): Promise<void> {
    // Upsert session row
    await this.prisma.ventSession.upsert({
      where: { id: sessionId },
      create: { id: sessionId, userId },
      update: { lastActiveAt: new Date(), isActive: true },
    });

    // Insert both messages
    await this.prisma.ventMessage.createMany({
      data: [
        { sessionId, role: "user", content: userMessage },
        { sessionId, role: "assistant", content: assistantReply },
      ],
    });

    // Increment counter and check if we should re-summarize
    const memory = await this.prisma.userVentMemory.upsert({
      where: { userId },
      create: { userId, summary: "", messagesSinceLastSummary: 2 },
      update: { messagesSinceLastSummary: { increment: 2 } },
    });

    if (memory.messagesSinceLastSummary >= SUMMARY_TRIGGER_EVERY_N) {
      // Fire-and-forget — don't block the response for this
      this.regenerateSummary(userId).catch(console.error);
    }
  }

  /**
   * Get the user's memory summary for injection into the system prompt.
   */
  async getUserSummary(userId: string): Promise<string | null> {
    const memory = await this.prisma.userVentMemory.findUnique({
      where: { userId },
      select: { summary: true },
    });
    return memory?.summary ?? null;
  }

  /**
   * Load recent messages from Postgres to seed Redis on a new session.
   * Returns the last `limit` messages across recent sessions.
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

    // Reverse so oldest-first (correct order for LLM context)
    return messages
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }

  /**
   * Regenerate the user's rolling summary using recent message history.
   * Merges with existing summary so context is never lost.
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

    const completion = await this.llmClient.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const newSummary = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!newSummary) return;

    await this.prisma.userVentMemory.update({
      where: { userId },
      data: { summary: newSummary, messagesSinceLastSummary: 0 },
    });
  }
}