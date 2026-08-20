import { describe, expect, it, vi, beforeEach } from "vitest";
import { aiService } from "./ai.service";
import { prisma } from "../../../infrastructure/prisma/client";

vi.mock("../../../infrastructure/prisma/client", () => ({
  prisma: {
    clientProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    clientAssesment: {
      findFirst: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
    },
    conversation: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../../shared/config/ai.config", () => ({
  aiConfig: {
    provider: "openai",
    openAiApiKey: "test-key",
    openAiBaseUrl: "https://api.openai.com/v1",
    openAiModel: "gpt-4o-mini",
    requestTimeoutMs: 5000,
  },
}));

describe("aiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("refreshClientAiSummary", () => {
    it("should generate deterministic summary when LLM fails or fetch throws and update clientProfile", async () => {
      const mockProfile = {
        id: "client-profile-1",
        userId: "user-1",
        ageGroup: "AGE_25_34",
        genderIdentity: "MALE",
        occupation: "WORKING_PROFESSIONAL",
        seekingSupportFor: "MYSELF",
        relationShipStatus: "SINGLE",
        user: { firstName: "John", lastName: "Doe" },
      };

      const mockAssessment = {
        id: "assessment-1",
        userId: "user-1",
        recentFeeling: "Overwhelmed with deadlines",
        nightSleep: "Insomnia / broken sleep",
        sucidalThoughts: null,
        selfHarm: null,
      };

      const mockBookings = [
        {
          id: "booking-1",
          startDateTime: new Date("2026-08-20T10:00:00Z"),
          sessionNotes: "Need practical techniques for workplace anxiety",
          status: "CONFIRMED",
        },
      ];

      const mockConversations = [
        {
          id: "conv-1",
          clientId: "client-profile-1",
          messages: [
            {
              content: "Looking forward to our session tomorrow",
              senderId: "user-1",
              createdAt: new Date("2026-08-19T10:00:00Z"),
            },
          ],
        },
      ];

      (prisma.clientProfile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.clientAssesment.findFirst as any).mockResolvedValue(mockAssessment);
      (prisma.booking.findMany as any).mockResolvedValue(mockBookings);
      (prisma.conversation.findMany as any).mockResolvedValue(mockConversations);
      (prisma.clientProfile.update as any).mockResolvedValue({
        ...mockProfile,
        aiSummary: "Summary",
      });

      const summary = await aiService.refreshClientAiSummary("client-profile-1");

      expect(prisma.clientProfile.findUnique).toHaveBeenCalledWith({
        where: { id: "client-profile-1" },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      expect(prisma.clientAssesment.findFirst).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
      });
      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        where: { clientId: "client-profile-1", paymentStatus: "CAPTURED" },
        orderBy: { startDateTime: "desc" },
        select: { id: true, startDateTime: true, sessionNotes: true, status: true },
      });
      expect(prisma.clientProfile.update).toHaveBeenCalledWith({
        where: { id: "client-profile-1" },
        data: {
          aiSummary: expect.any(String),
          aiSummaryUpdatedAt: expect.any(Date),
        },
      });

      expect(summary).toContain("Client Overview & Context");
      expect(summary).toContain("Assessment Highlights");
      expect(summary).toContain("Session Notes Across Bookings");
    });

    it("should throw error if client profile is not found", async () => {
      (prisma.clientProfile.findUnique as any).mockResolvedValue(null);

      await expect(aiService.refreshClientAiSummary("non-existent-client")).rejects.toThrow(
        "Client profile not found for ID non-existent-client"
      );
    });
  });

  describe("executeTool", () => {
    it("should execute meditate tool", async () => {
      const result = await aiService.executeTool("meditate");
      expect(result.type).toBe("tool_response");
      expect(result.tool).toBe("meditate");
    });

    it("should execute joke tool", async () => {
      const result = await aiService.executeTool("joke");
      expect(result.type).toBe("tool_response");
      expect(result.tool).toBe("joke");
    });
  });
});
