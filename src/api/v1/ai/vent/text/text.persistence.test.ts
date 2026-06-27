import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { VentPersistenceService } from "./text.persistence";
import { callLLM } from "../../../../../infrastructure/llm";
import { encryptContent, decryptContent } from "../../../../../infrastructure/crypto/vent.crypto";
import { emailQueue } from "../../../../../infrastructure/queues";

vi.mock("../../../../../infrastructure/llm", () => ({
  callLLM: vi.fn(),
}));

vi.mock("../../../../../infrastructure/queues", () => ({
  emailQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-123" }),
  },
}));

vi.mock("../../../../../infrastructure/crypto/vent.crypto", () => ({
  encryptContent: vi.fn((content: string) => `encrypted:${content}`),
  decryptContent: vi.fn((stored: string) => {
    if (stored.startsWith("encrypted:")) {
      return stored.replace("encrypted:", "");
    }
    return stored;
  }),
}));

describe("VentPersistenceService", () => {
  let mockPrisma: any;
  let service: VentPersistenceService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      ventSession: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      ventMessage: {
        findMany: vi.fn(),
        createMany: vi.fn(),
      },
      userVentMemory: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      extensionUsage: {
        upsert: vi.fn(),
      },
    };

    service = new VentPersistenceService(mockPrisma as unknown as PrismaClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createSession", () => {
    it("should create a session and return sessionId", async () => {
      mockPrisma.ventSession.create.mockResolvedValue({ id: "session-123" });

      const result = await service.createSession("user-123");

      expect(mockPrisma.ventSession.create).toHaveBeenCalledWith({
        data: { userId: "user-123" },
      });
      expect(result).toEqual({ sessionId: "session-123" });
    });
  });

  describe("getUserFirstName", () => {
    it("should return user first name if user exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ firstName: "Sanket" });

      const result = await service.getUserFirstName("user-123");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: { firstName: true },
      });
      expect(result).toBe("Sanket");
    });

    it("should return null if user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserFirstName("user-123");

      expect(result).toBeNull();
    });
  });

  describe("getUserSessions", () => {
    it("should retrieve sessions and map previews with correct crisis flag", async () => {
      const mockSessions = [
        {
          id: "session-1",
          lastActiveAt: new Date(),
          startedAt: new Date(),
          messages: [{ content: "encrypted:hello user", role: "user" }],
          _count: { messages: 2 },
        },
        {
          id: "session-2",
          lastActiveAt: new Date(),
          startedAt: new Date(),
          messages: [{ content: "encrypted:crisis help", role: "user" }],
          _count: { messages: 3 },
        },
      ];

      const mockLastMessages = [
        { sessionId: "session-1", content: "encrypted:assistant reply 1" },
        { sessionId: "session-2", content: "encrypted:assistant reply 2" },
      ];

      const mockCrisisMessages = [{ sessionId: "session-2" }];

      mockPrisma.ventSession.findMany.mockResolvedValue(mockSessions);
      mockPrisma.ventMessage.findMany
        .mockResolvedValueOnce(mockLastMessages) // First call is for lastMessages
        .mockResolvedValueOnce(mockCrisisMessages); // Second call is for crisis check

      const previews = await service.getUserSessions("user-123");

      expect(mockPrisma.ventSession.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123", isActive: true, messages: { some: {} } },
        orderBy: { lastActiveAt: "desc" },
        take: 30,
        include: expect.any(Object),
      });

      expect(previews.length).toBe(2);
      expect(previews[0].sessionId).toBe("session-1");
      expect(previews[0].title).toBe("hello user");
      expect(previews[0].preview).toBe("assistant reply 1");
      expect(previews[0].isCrisis).toBe(false);

      expect(previews[1].sessionId).toBe("session-2");
      expect(previews[1].title).toBe("crisis help");
      expect(previews[1].preview).toBe("assistant reply 2");
      expect(previews[1].isCrisis).toBe(true);
    });
  });

  describe("getSessionMessages", () => {
    it("should retrieve messages for valid session owner and decrypt content", async () => {
      mockPrisma.ventSession.findFirst.mockResolvedValue({ id: "session-123" });
      mockPrisma.ventMessage.findMany.mockResolvedValue([
        { role: "user", content: "encrypted:feeling down", createdAt: new Date(), isCrisis: true },
        {
          role: "assistant",
          content: "encrypted:i am here",
          createdAt: new Date(),
          isCrisis: false,
        },
      ]);

      const messages = await service.getSessionMessages("user-123", "session-123");

      expect(mockPrisma.ventSession.findFirst).toHaveBeenCalledWith({
        where: { id: "session-123", userId: "user-123" },
      });
      expect(mockPrisma.ventMessage.findMany).toHaveBeenCalledWith({
        where: { sessionId: "session-123" },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true, isCrisis: true },
      });

      expect(messages.length).toBe(2);
      expect(messages[0]).toEqual({
        role: "user",
        content: "feeling down",
        createdAt: expect.any(Date),
        isCrisis: true,
      });
      expect(messages[1]).toEqual({
        role: "assistant",
        content: "i am here",
        createdAt: expect.any(Date),
        isCrisis: false,
      });
    });

    it("should throw error if session is not found", async () => {
      mockPrisma.ventSession.findFirst.mockResolvedValue(null);

      await expect(service.getSessionMessages("user-123", "session-123")).rejects.toThrow(
        "Session not found"
      );
    });
  });

  describe("deleteSession", () => {
    it("should perform a soft delete on the session", async () => {
      await service.deleteSession("user-123", "session-123");

      expect(mockPrisma.ventSession.updateMany).toHaveBeenCalledWith({
        where: { id: "session-123", userId: "user-123" },
        data: { isActive: false },
      });
    });
  });

  describe("verifySessionOwner", () => {
    it("should return true if active session belongs to user", async () => {
      mockPrisma.ventSession.findFirst.mockResolvedValue({ id: "session-123" });

      const result = await service.verifySessionOwner("user-123", "session-123");

      expect(mockPrisma.ventSession.findFirst).toHaveBeenCalledWith({
        where: { id: "session-123", userId: "user-123", isActive: true },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it("should return false if active session does not belong to user", async () => {
      mockPrisma.ventSession.findFirst.mockResolvedValue(null);

      const result = await service.verifySessionOwner("user-123", "session-123");

      expect(result).toBe(false);
    });
  });

  describe("persistMessages", () => {
    it("should save messages and increment summary counter without triggering summary if below threshold", async () => {
      mockPrisma.userVentMemory.findUnique.mockResolvedValue({
        currentEma: 0.0,
        therapyEmailSentAt: null,
      });
      mockPrisma.userVentMemory.upsert.mockResolvedValue({
        messagesSinceLastSummary: 2,
        currentEma: 0.0,
        therapyEmailSentAt: null,
      });

      await service.persistMessages("user-123", "session-123", "hi", "hello", false);

      expect(mockPrisma.ventSession.update).toHaveBeenCalledWith({
        where: { id: "session-123" },
        data: { lastActiveAt: expect.any(Date) },
      });

      expect(mockPrisma.ventMessage.createMany).toHaveBeenCalledWith({
        data: [
          { sessionId: "session-123", role: "user", content: "encrypted:hi", isCrisis: false },
          {
            sessionId: "session-123",
            role: "assistant",
            content: "encrypted:hello",
            isCrisis: false,
          },
        ],
      });

      expect(mockPrisma.userVentMemory.upsert).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        create: { userId: "user-123", summary: "", messagesSinceLastSummary: 2, currentEma: 0.0 },
        update: { messagesSinceLastSummary: { increment: 2 }, currentEma: 0.0 },
      });

      expect(mockPrisma.extensionUsage.upsert).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        create: { userId: "user-123", messageCount: 1 },
        update: { messageCount: { increment: 1 } },
      });

      expect(callLLM).not.toHaveBeenCalled();
    });

    it("should trigger summary regeneration when threshold is reached", async () => {
      mockPrisma.userVentMemory.findUnique.mockResolvedValue({
        currentEma: 0.0,
        therapyEmailSentAt: null,
      });
      mockPrisma.userVentMemory.upsert.mockResolvedValue({
        messagesSinceLastSummary: 10,
        currentEma: 0.0,
        therapyEmailSentAt: null,
      });
      mockPrisma.ventMessage.findMany.mockResolvedValue([
        { role: "user", content: "encrypted:stressed" },
        { role: "assistant", content: "encrypted:talk to me" },
      ]);
      mockPrisma.userVentMemory.findUnique.mockImplementation(async (args: any) => {
        if (args.select?.summary) return { summary: "encrypted:old summary" };
        return { currentEma: 0.0, therapyEmailSentAt: null };
      });
      vi.mocked(callLLM).mockResolvedValue("new summary details");

      await service.persistMessages("user-123", "session-123", "hi", "hello", true);

      // Give event loop time to process async summary task
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockPrisma.ventMessage.createMany).toHaveBeenCalledWith({
        data: [
          { sessionId: "session-123", role: "user", content: "encrypted:hi", isCrisis: true },
          {
            sessionId: "session-123",
            role: "assistant",
            content: "encrypted:hello",
            isCrisis: false,
          },
        ],
      });

      expect(mockPrisma.ventMessage.findMany).toHaveBeenCalledWith({
        where: { session: { userId: "user-123" } },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { role: true, content: true },
      });

      expect(callLLM).toHaveBeenCalledWith({
        messages: expect.any(Array),
        temperature: 0.3,
        max_tokens: 300,
      });

      expect(mockPrisma.userVentMemory.update).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        data: {
          summary: "encrypted:new summary details",
          messagesSinceLastSummary: 0,
        },
      });

      expect(mockPrisma.extensionUsage.upsert).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        create: { userId: "user-123", messageCount: 1 },
        update: { messageCount: { increment: 1 } },
      });
    });

    it("should calculate and update EMA correctly based on sentiment scores", async () => {
      mockPrisma.userVentMemory.findUnique.mockResolvedValue({
        currentEma: -0.2,
        therapyEmailSentAt: null,
      });
      mockPrisma.userVentMemory.upsert.mockResolvedValue({
        messagesSinceLastSummary: 2,
        currentEma: -0.29,
        therapyEmailSentAt: null,
      });

      // Sentiment: ANXIOUS (-0.5). Alpha: 0.3. Previous EMA: -0.2.
      // Next EMA: (-0.5 * 0.3) + (-0.2 * 0.7) = -0.15 + -0.14 = -0.29
      await service.persistMessages(
        "user-123",
        "session-123",
        "stressed",
        "relax",
        false,
        "ANXIOUS"
      );

      expect(mockPrisma.userVentMemory.upsert).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        create: { userId: "user-123", summary: "", messagesSinceLastSummary: 2, currentEma: -0.29 },
        update: { messagesSinceLastSummary: { increment: 2 }, currentEma: -0.29 },
      });
    });

    it("should queue therapy email and update therapyEmailSentAt when EMA threshold is crossed", async () => {
      mockPrisma.userVentMemory.findUnique.mockResolvedValue({
        currentEma: -0.3,
        therapyEmailSentAt: null,
      });
      // Next EMA: (-1.0 * 0.3) + (-0.3 * 0.7) = -0.3 + -0.21 = -0.51 (which is <= -0.4)
      mockPrisma.userVentMemory.upsert.mockResolvedValue({
        messagesSinceLastSummary: 2,
        currentEma: -0.51,
        therapyEmailSentAt: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        email: "user@example.com",
        firstName: "Yash",
        role: "CLIENT",
      });

      await service.persistMessages("user-123", "session-123", "sad", "comfort", false, "SAD");

      // Verify email queued
      expect(emailQueue.add).toHaveBeenCalledWith(
        "sendTherapyRecommendationEmail",
        expect.objectContaining({
          to: "user@example.com",
          subject: "We're Here for You - CatalystCare Support",
          html: expect.stringContaining("Connect with a Therapist"),
        })
      );

      // Verify timestamp updated
      expect(mockPrisma.userVentMemory.update).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        data: { therapyEmailSentAt: expect.any(Date) },
      });
    });

    it("should queue professional wellbeing email when a therapist is in distress", async () => {
      mockPrisma.userVentMemory.findUnique.mockResolvedValue({
        currentEma: -0.3,
        therapyEmailSentAt: null,
      });
      mockPrisma.userVentMemory.upsert.mockResolvedValue({
        messagesSinceLastSummary: 2,
        currentEma: -0.51,
        therapyEmailSentAt: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        email: "therapist@example.com",
        firstName: "Dr. Yash",
        role: "THERAPIST",
      });

      await service.persistMessages("user-123", "session-123", "sad", "comfort", false, "SAD");

      // Verify email queued
      expect(emailQueue.add).toHaveBeenCalledWith(
        "sendTherapyRecommendationEmail",
        expect.objectContaining({
          to: "therapist@example.com",
          subject: "Taking Care of Yourself - CatalystCare Support",
          html: expect.stringContaining("Explore Wellness Tools"),
        })
      );

      // Verify timestamp updated
      expect(mockPrisma.userVentMemory.update).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        data: { therapyEmailSentAt: expect.any(Date) },
      });
    });

    it("should not queue therapy email if it was sent recently (cooldown)", async () => {
      const recentDate = new Date();
      mockPrisma.userVentMemory.findUnique.mockResolvedValue({
        currentEma: -0.3,
        therapyEmailSentAt: recentDate,
      });
      mockPrisma.userVentMemory.upsert.mockResolvedValue({
        messagesSinceLastSummary: 2,
        currentEma: -0.51,
        therapyEmailSentAt: recentDate,
      });

      await service.persistMessages("user-123", "session-123", "sad", "comfort", false, "SAD");

      // Verify email NOT queued
      expect(emailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe("getUserSummary", () => {
    it("should return decrypted summary if it exists", async () => {
      mockPrisma.userVentMemory.findUnique.mockResolvedValue({
        summary: "encrypted:user has anxiety",
      });

      const summary = await service.getUserSummary("user-123");

      expect(mockPrisma.userVentMemory.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        select: { summary: true },
      });
      expect(summary).toBe("user has anxiety");
    });

    it("should return null if user has no summary", async () => {
      mockPrisma.userVentMemory.findUnique.mockResolvedValue(null);

      const summary = await service.getUserSummary("user-123");

      expect(summary).toBeNull();
    });
  });

  describe("getRecentMessages", () => {
    it("should fetch recent messages reversed and decrypted", async () => {
      mockPrisma.ventMessage.findMany.mockResolvedValue([
        { role: "assistant", content: "encrypted:message 2" },
        { role: "user", content: "encrypted:message 1" },
      ]);

      const messages = await service.getRecentMessages("user-123", "session-123", 2);

      expect(mockPrisma.ventMessage.findMany).toHaveBeenCalledWith({
        where: { sessionId: "session-123", session: { userId: "user-123" } },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { role: true, content: true },
      });

      expect(messages).toEqual([
        { role: "user", content: "message 1" },
        { role: "assistant", content: "message 2" },
      ]);
    });
  });

  describe("getMessagesInTimeWindow", () => {
    it("should fetch decrypted messages within the specified time window", async () => {
      const mockMessages = [
        { role: "user", content: "encrypted:feeling stressed", createdAt: new Date() },
        { role: "assistant", content: "encrypted:tell me more", createdAt: new Date() },
      ];

      mockPrisma.ventMessage.findMany.mockResolvedValue(mockMessages);

      const messages = await service.getMessagesInTimeWindow("user-123", 72);

      expect(mockPrisma.ventMessage.findMany).toHaveBeenCalledWith({
        where: {
          session: { userId: "user-123", isActive: true },
          createdAt: { gte: expect.any(Date) },
        },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true },
      });

      expect(messages).toEqual([
        { role: "user", content: "feeling stressed", createdAt: expect.any(Date) },
        { role: "assistant", content: "tell me more", createdAt: expect.any(Date) },
      ]);
    });
  });

  describe("getRecentMessagesCrossSession", () => {
    it("should fetch recent decrypted messages across all sessions sorted chronologically (reversed)", async () => {
      const mockMessages = [
        { role: "assistant", content: "encrypted:tell me more", createdAt: new Date() },
        { role: "user", content: "encrypted:feeling stressed", createdAt: new Date() },
      ];

      mockPrisma.ventMessage.findMany.mockResolvedValue(mockMessages);

      const messages = await service.getRecentMessagesCrossSession("user-123", 2);

      expect(mockPrisma.ventMessage.findMany).toHaveBeenCalledWith({
        where: {
          session: { userId: "user-123", isActive: true },
        },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { role: true, content: true, createdAt: true },
      });

      expect(messages).toEqual([
        { role: "user", content: "feeling stressed", createdAt: expect.any(Date) },
        { role: "assistant", content: "tell me more", createdAt: expect.any(Date) },
      ]);
    });
  });
});
