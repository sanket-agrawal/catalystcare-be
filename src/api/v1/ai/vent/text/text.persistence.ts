import { PrismaClient } from "@prisma/client";
import { callLLM } from "../../../../../infrastructure/llm";
import { VentSessionPreview } from "./text.types";
import { encryptContent, decryptContent } from "../../../../../infrastructure/crypto/vent.crypto";
import { emailQueue } from "../../../../../infrastructure/queues";
import { emailFromAddress } from "../../../../../shared/config/email.config";
import {
  therapyRecommendationTemplate,
  professionalWellbeingTemplate,
} from "../../../../../shared/email-templates/wellness";
import { differenceInDays } from "date-fns";

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

function getSentimentScore(sentiment?: string): number {
  if (!sentiment) return 0.0;
  switch (sentiment.toUpperCase()) {
    case "POSITIVE":
      return 1.0;
    case "NEUTRAL":
      return 0.0;
    case "ANXIOUS":
    case "LONELY":
      return -0.5;
    case "SAD":
    case "OVERWHELMED":
    case "ANGRY":
      return -1.0;
    default:
      return 0.0;
  }
}

export class VentPersistenceService {
  constructor(private prisma: PrismaClient) {}

  // ─── Session Management ────────────────────────────────────────

  async createSession(userId: string): Promise<{ sessionId: string }> {
    const session = await this.prisma.ventSession.create({
      data: { userId },
    });
    return { sessionId: session.id };
  }

  async getUserFirstName(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });
    return user?.firstName ?? null;
  }

  async getUserSessions(userId: string): Promise<VentSessionPreview[]> {
    const sessions = await this.prisma.ventSession.findMany({
      where: { userId, isActive: true, messages: { some: {} } },
      orderBy: { lastActiveAt: "desc" },
      take: 30,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
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

    const lastMsgMap = new Map(lastMessages.map((m) => [m.sessionId, String(m.content)]));

    // Fetch if any message in the sessions has isCrisis: true
    const crisisMessages = await this.prisma.ventMessage.findMany({
      where: {
        sessionId: { in: sessionIds },
        isCrisis: true,
      },
      select: { sessionId: true },
    });
    const crisisSessionIds = new Set(crisisMessages.map((m) => m.sessionId));

    return sessions.map((s) => {
      const rawFirst = String(s.messages[0]?.content ?? ""); // String() already there ✓
      const firstMsg = rawFirst
        ? (() => {
            try {
              return decryptContent(rawFirst);
            } catch {
              return rawFirst;
            }
          })()
        : "New conversation";

      const rawPreview = String(lastMsgMap.get(s.id) ?? ""); // add String() here
      const previewText = rawPreview
        ? (() => {
            try {
              return decryptContent(rawPreview);
            } catch {
              return rawPreview;
            }
          })()
        : "";

      return {
        sessionId: s.id,
        title: firstMsg.slice(0, 60) + (firstMsg.length > 60 ? "..." : ""),
        preview: previewText.slice(0, 80),
        lastActiveAt: s.lastActiveAt,
        startedAt: s.startedAt,
        messageCount: s._count.messages,
        isCrisis: crisisSessionIds.has(s.id),
      };
    });
  }

  async getSessionMessages(
    userId: string,
    sessionId: string
  ): Promise<{ role: string; content: string; createdAt: Date; isCrisis: boolean }[]> {
    const session = await this.prisma.ventSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new Error("Session not found");

    const messages = await this.prisma.ventMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true, createdAt: true, isCrisis: true },
    });

    // Cast content explicitly since Prisma infers it as unknown
    return messages.map((m) => ({
      role: String(m.role),
      content: decryptContent(String(m.content)),
      createdAt: m.createdAt,
      isCrisis: m.isCrisis,
    }));
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
    assistantReply: string,
    isCrisis: boolean = false,
    sentiment?: string
  ): Promise<void> {
    await this.prisma.ventSession.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });

    await this.prisma.ventMessage.createMany({
      data: [
        { sessionId, role: "user", content: encryptContent(userMessage), isCrisis },
        { sessionId, role: "assistant", content: encryptContent(assistantReply), isCrisis: false },
      ],
    });

    // Increment extension message usage count
    await this.prisma.extensionUsage.upsert({
      where: { userId },
      create: { userId, messageCount: 1 },
      update: { messageCount: { increment: 1 } },
    });

    const existingMemory = await this.prisma.userVentMemory.findUnique({
      where: { userId },
      select: { currentEma: true, therapyEmailSentAt: true },
    });

    const previousEma = existingMemory?.currentEma ?? 0.0;
    const score = getSentimentScore(sentiment);
    const alpha = 0.3;
    const nextEma = score * alpha + previousEma * (1.0 - alpha);

    const memory = await this.prisma.userVentMemory.upsert({
      where: { userId },
      create: {
        userId,
        summary: "",
        messagesSinceLastSummary: 2,
        currentEma: nextEma,
      },
      update: {
        messagesSinceLastSummary: { increment: 2 },
        currentEma: nextEma,
      },
    });

    if (nextEma <= -0.4) {
      const lastSent = memory.therapyEmailSentAt;
      const shouldSend = !lastSent || differenceInDays(new Date(), lastSent) >= 7;

      if (shouldSend) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true, role: true },
        });

        if (user && user.email) {
          try {
            const isConsumer = ["CLIENT", "EMPLOYEE", "STUDENT"].includes(user.role);
            const htmlContent = isConsumer
              ? therapyRecommendationTemplate(user.firstName || "there")
              : professionalWellbeingTemplate(user.firstName || "there");
            const emailSubject = isConsumer
              ? "We're Here for You - CatalystCare Support"
              : "Taking Care of Yourself - CatalystCare Support";

            await emailQueue.add("sendTherapyRecommendationEmail", {
              to: user.email,
              subject: emailSubject,
              html: htmlContent,
              sender: emailFromAddress().infoEmail,
            });

            await this.prisma.userVentMemory.update({
              where: { userId },
              data: { therapyEmailSentAt: new Date() },
            });
          } catch (err) {
            console.error("[VentPersistenceService] Failed to queue therapy email:", err);
          }
        }
      }
    }

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
    if (!memory?.summary) return null;
    try {
      return decryptContent(memory.summary);
    } catch {
      // handles existing unencrypted rows during transition
      return memory.summary;
    }
  }

  async getUserVentMemory(userId: string) {
    return this.prisma.userVentMemory.findUnique({
      where: { userId },
      select: { currentEma: true, therapyEmailSentAt: true },
    });
  }

  async getRecentMessages(
    userId: string,
    sessionId: string, // scope to current session only
    limit = 20
  ): Promise<{ role: "user" | "assistant"; content: string }[]> {
    const messages = await this.prisma.ventMessage.findMany({
      where: { sessionId, session: { userId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { role: true, content: true },
    });

    return messages.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: decryptContent(String(m.content)),
    }));
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

    console.log("[VentPersistenceService] ---- START SUMMARY REGENERATION ----");
    console.log("[VentPersistenceService] Raw first message from DB:", recentMessages[0].content);

    const currentMemory = await this.prisma.userVentMemory.findUnique({
      where: { userId },
    });

    const conversationText = recentMessages
      .reverse()
      .map((m, idx) => {
        let decryptedContent = "";
        try {
          decryptedContent = decryptContent(String(m.content));
        } catch {
          decryptedContent = String(m.content);
        }
        if (idx === 0) {
          console.log("[VentPersistenceService] Decrypted first message:", decryptedContent);
        }
        return `${m.role === "user" ? "User" : "Manasi"}: ${decryptedContent}`;
      })
      .join("\n");

    let decryptedSummary = "";
    if (currentMemory?.summary) {
      console.log("[VentPersistenceService] Raw summary from DB:", currentMemory.summary);
      try {
        decryptedSummary = decryptContent(currentMemory.summary);
      } catch {
        decryptedSummary = currentMemory.summary;
      }
      console.log("[VentPersistenceService] Decrypted summary:", decryptedSummary);
    }

    console.log("[VentPersistenceService] ---- END SUMMARY REGENERATION PROMPT PREPARATION ----");

    const userPrompt = decryptedSummary
      ? `Existing summary:\n${decryptedSummary}\n\nNew conversation to incorporate:\n${conversationText}`
      : `Conversation:\n${conversationText}`;

    const newSummary = await callLLM({
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
      data: {
        summary: encryptContent(newSummary.trim()),
        messagesSinceLastSummary: 0,
      },
    });
  }
}
