import { describe, expect, it, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { VentController } from "./text.controller";
import { VentContextService } from "./text.service";
import { VentLLMService } from "./text.llm.service";
import { VentPersistenceService } from "./text.persistence";
import ApiError from "../../../../../shared/utils/ApiError";
import ApiResponse from "../../../../../shared/utils/ApiResponse";
import { INDIAN_HELPLINES } from "./text.helplines";

describe("VentController", () => {
  let mockContextService: any;
  let mockLLMService: any;
  let mockPersistenceService: any;
  let controller: VentController;

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContextService = {
      getContextMessages: vi.fn(),
      appendMessages: vi.fn(),
      deleteSession: vi.fn(),
    };

    mockLLMService = {
      processVentMessage: vi.fn(),
      generateInsight: vi.fn(),
    };

    mockPersistenceService = {
      createSession: vi.fn(),
      getUserSessions: vi.fn(),
      getSessionMessages: vi.fn(),
      deleteSession: vi.fn(),
      verifySessionOwner: vi.fn(),
      getUserSummary: vi.fn(),
      getUserFirstName: vi.fn(),
      persistMessages: vi.fn(),
      getUserVentMemory: vi.fn(),
      getRecentMessages: vi.fn().mockResolvedValue([]),
      getMessagesInTimeWindow: vi.fn(),
      getRecentMessagesCrossSession: vi.fn(),
    };

    controller = new VentController(
      mockContextService as unknown as VentContextService,
      mockLLMService as unknown as VentLLMService,
      mockPersistenceService as unknown as VentPersistenceService
    );

    mockReq = {
      user: { id: "user-123" } as any,
      params: {},
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
    mockPersistenceService.getUserVentMemory.mockResolvedValue({ currentEma: 0.0 });
  });

  describe("createSession", () => {
    it("should create a session successfully", async () => {
      mockPersistenceService.createSession.mockResolvedValue({ sessionId: "session-uuid" });

      await controller.createSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPersistenceService.createSession).toHaveBeenCalledWith("user-123");
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 201, "Session created", { sessionId: "session-uuid" })
      );
    });

    it("should handle error during session creation", async () => {
      mockPersistenceService.createSession.mockRejectedValue(new Error("Db error"));

      await controller.createSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(false, 400, "Error Creating Session")
      );
    });
  });

  describe("getSessions", () => {
    it("should fetch user sessions successfully", async () => {
      const mockSessions = [
        {
          sessionId: "s1",
          title: "Vent 1",
          preview: "hello",
          lastActiveAt: new Date(),
          startedAt: new Date(),
          messageCount: 2,
        },
      ];
      mockPersistenceService.getUserSessions.mockResolvedValue(mockSessions);

      await controller.getSessions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPersistenceService.getUserSessions).toHaveBeenCalledWith("user-123");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Sessions fetched", mockSessions)
      );
    });

    it("should handle error during fetching sessions", async () => {
      mockPersistenceService.getUserSessions.mockRejectedValue(new Error("Db error"));

      await controller.getSessions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(false, 400, "Error Getting Session")
      );
    });
  });

  describe("getSessionMessages", () => {
    it("should fetch session messages successfully", async () => {
      const mockMessages = [{ role: "user", content: "hello", createdAt: new Date() }];
      mockReq.params = { sessionId: "session-uuid" };
      mockPersistenceService.getSessionMessages.mockResolvedValue(mockMessages);

      await controller.getSessionMessages(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPersistenceService.getSessionMessages).toHaveBeenCalledWith(
        "user-123",
        "session-uuid"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Messages fetched", mockMessages)
      );
    });

    it("should handle error during fetching session messages", async () => {
      mockReq.params = { sessionId: "session-uuid" };
      mockPersistenceService.getSessionMessages.mockRejectedValue(new Error("Db error"));

      await controller.getSessionMessages(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(false, 400, "Error Getting Messages")
      );
    });
  });

  describe("deleteSession", () => {
    it("should delete session successfully from DB and cache", async () => {
      mockReq.params = { sessionId: "session-uuid" };
      mockPersistenceService.deleteSession.mockResolvedValue(undefined);
      mockContextService.deleteSession.mockResolvedValue(undefined);

      await controller.deleteSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPersistenceService.deleteSession).toHaveBeenCalledWith("user-123", "session-uuid");
      expect(mockContextService.deleteSession).toHaveBeenCalledWith("user-123", "session-uuid");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(new ApiResponse(true, 200, "Session deleted"));
    });

    it("should handle error during deleting session", async () => {
      mockReq.params = { sessionId: "session-uuid" };
      mockPersistenceService.deleteSession.mockRejectedValue(new Error("Db error"));

      await controller.deleteSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(false, 400, "Error Deleting Session")
      );
    });
  });

  describe("ventText", () => {
    const validSessionId = "e7b85bb0-c116-4a4a-9eb3-228bf5850937";

    it("should fail validation if body is invalid", async () => {
      mockReq.body = { message: "", sessionId: "not-a-uuid" };

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 400,
          message: "Validation failed",
        })
      );
    });

    it("should return 404 if user is not the session owner", async () => {
      mockReq.body = { message: "Hello", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(false);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPersistenceService.verifySessionOwner).toHaveBeenCalledWith(
        "user-123",
        validSessionId
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(new ApiResponse(false, 404, "Session not found"));
    });

    it("should process normal valid message, save to history/db, and reply successfully", async () => {
      mockReq.body = { message: "I feel anxious", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);

      const mockHistory = [{ role: "user", content: "previous" }];
      mockContextService.getContextMessages.mockResolvedValue(mockHistory);
      mockPersistenceService.getUserSummary.mockResolvedValue("User summary");
      mockPersistenceService.getUserFirstName.mockResolvedValue("Sanket");

      const mockLLMResponse = {
        valid: true,
        reply: "I understand. Anxiousness can be very tough.",
        isCrisis: false,
        suggestTherapy: false,
      };
      mockLLMService.processVentMessage.mockResolvedValue(mockLLMResponse);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockContextService.getContextMessages).toHaveBeenCalledWith(
        "user-123",
        validSessionId
      );
      expect(mockPersistenceService.getUserSummary).toHaveBeenCalledWith("user-123");
      expect(mockPersistenceService.getUserFirstName).toHaveBeenCalledWith("user-123");

      expect(mockLLMService.processVentMessage).toHaveBeenCalledWith(
        "I feel anxious",
        mockHistory,
        "User summary",
        "Sanket"
      );

      // Verify saving to cache and database
      expect(mockContextService.appendMessages).toHaveBeenCalledWith(
        "user-123",
        validSessionId,
        expect.arrayContaining([
          expect.objectContaining({ role: "user", content: "I feel anxious" }),
          expect.objectContaining({ role: "assistant", content: mockLLMResponse.reply }),
        ])
      );
      expect(mockPersistenceService.persistMessages).toHaveBeenCalledWith(
        "user-123",
        validSessionId,
        "I feel anxious",
        mockLLMResponse.reply,
        false,
        undefined
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Vent Reply Successfully", {
          sessionId: validSessionId,
          reply: mockLLMResponse.reply,
          isValid: true,
          isCrisis: false,
          suggestTherapy: false,
          platformUrl: undefined,
          sentiment: undefined,
          suggestedExercise: undefined,
        })
      );
    });

    it("should suggest therapy when LLM suggestTherapy is true", async () => {
      mockReq.body = {
        message: "I've been feeling depressed for weeks",
        sessionId: validSessionId,
      };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockResolvedValue([]);

      const mockLLMResponse = {
        valid: true,
        reply:
          "It sounds like you have been dealing with this for a while. A therapist could offer deeper support.",
        isCrisis: false,
        suggestTherapy: true,
      };
      mockLLMService.processVentMessage.mockResolvedValue(mockLLMResponse);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(
          true,
          200,
          "Vent Reply Successfully",
          expect.objectContaining({
            suggestTherapy: true,
            platformUrl: expect.stringContaining("catalystcare"),
          })
        )
      );
    });

    it("should handle crisis message properly by returning helplines and setting suggestTherapy to false", async () => {
      mockReq.body = { message: "I want to end it all", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockResolvedValue([]);

      const mockLLMResponse = {
        valid: true,
        reply: "Please stay safe. Support is available.",
        isCrisis: true,
        suggestTherapy: true, // system prompt says to set suggestTherapy true for crisis, but controller should override to false
      };
      mockLLMService.processVentMessage.mockResolvedValue(mockLLMResponse);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPersistenceService.persistMessages).toHaveBeenCalledWith(
        "user-123",
        validSessionId,
        "I want to end it all",
        mockLLMResponse.reply,
        true,
        undefined
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Vent Reply Successfully", {
          sessionId: validSessionId,
          reply: mockLLMResponse.reply,
          isValid: true,
          isCrisis: true,
          helplines: INDIAN_HELPLINES,
          suggestTherapy: false, // overridden to false by controller if isCrisis is true
          platformUrl: undefined,
          sentiment: undefined,
          suggestedExercise: undefined,
        })
      );
    });

    it("should return invalid response and not save to cache or db if LLM says invalid", async () => {
      mockReq.body = { message: "Write a python script", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockResolvedValue([]);

      const mockLLMResponse = {
        valid: false,
        message: "I'm here to support your emotional wellbeing.",
        isCrisis: false,
      };
      mockLLMService.processVentMessage.mockResolvedValue(mockLLMResponse);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      // Verify no appending or persistence happened
      expect(mockContextService.appendMessages).not.toHaveBeenCalled();
      expect(mockPersistenceService.persistMessages).not.toHaveBeenCalled();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Vent Reply Successfully", {
          sessionId: validSessionId,
          reply: "I'm here to support your emotional wellbeing.",
          isValid: false,
          isCrisis: false,
          suggestTherapy: false,
          platformUrl: undefined,
          sentiment: undefined,
          suggestedExercise: undefined,
        })
      );
    });

    it("should include sentiment and suggestedExercise when sentiment is detected", async () => {
      mockReq.body = { message: "I feel very anxious and overwhelmed", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockResolvedValue([]);

      const mockLLMResponse = {
        valid: true,
        reply: "I hear you. Let's take a deep breath.",
        isCrisis: false,
        suggestTherapy: false,
        sentiment: "ANXIOUS",
      };
      mockLLMService.processVentMessage.mockResolvedValue(mockLLMResponse);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Vent Reply Successfully", {
          sessionId: validSessionId,
          reply: mockLLMResponse.reply,
          isValid: true,
          isCrisis: false,
          suggestTherapy: false,
          platformUrl: undefined,
          sentiment: "ANXIOUS",
          suggestedExercise: {
            type: "breathing",
            title: "Box Breathing",
            instructions:
              "Inhale for 4 seconds, hold your breath for 4 seconds, exhale for 4 seconds, and hold empty for 4 seconds. Repeat this cycle 4 times to calm your nervous system.",
          },
        })
      );
    });

    it("should override suggestTherapy to true if user's EMA is <= -0.4 and session has enough depth", async () => {
      mockReq.body = { message: "I feel stressed", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockResolvedValue([]);

      const mockLLMResponse = {
        valid: true,
        reply: "I understand.",
        isCrisis: false,
        suggestTherapy: false,
        sentiment: "ANXIOUS",
      };
      mockLLMService.processVentMessage.mockResolvedValue(mockLLMResponse);
      mockPersistenceService.getUserVentMemory.mockResolvedValue({ currentEma: -0.45 });
      // Provide enough messages (6+) so the depth check passes
      mockPersistenceService.getRecentMessages.mockResolvedValue([
        { role: "user", content: "I feel bad" },
        { role: "assistant", content: "What happened?" },
        { role: "user", content: "Work is awful" },
        { role: "assistant", content: "Tell me more." },
        { role: "user", content: "I feel stressed" },
        { role: "assistant", content: "I understand." },
      ]);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(
          true,
          200,
          "Vent Reply Successfully",
          expect.objectContaining({
            suggestTherapy: true,
          })
        )
      );
    });

    it("should NOT override suggestTherapy via EMA on shallow sessions (fewer than 6 messages)", async () => {
      mockReq.body = { message: "I feel stressed", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockResolvedValue([]);

      const mockLLMResponse = {
        valid: true,
        reply: "What's going on?",
        isCrisis: false,
        suggestTherapy: false,
        sentiment: "ANXIOUS",
      };
      mockLLMService.processVentMessage.mockResolvedValue(mockLLMResponse);
      mockPersistenceService.getUserVentMemory.mockResolvedValue({ currentEma: -0.6 });
      // Only 2 messages — not enough depth
      mockPersistenceService.getRecentMessages.mockResolvedValue([
        { role: "user", content: "I feel stressed" },
        { role: "assistant", content: "What's going on?" },
      ]);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(
          true,
          200,
          "Vent Reply Successfully",
          expect.objectContaining({
            suggestTherapy: false,
          })
        )
      );
    });

    it("should NOT override suggestTherapy via EMA if therapy was already suggested recently", async () => {
      mockReq.body = { message: "Yeah still feeling low", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockResolvedValue([]);

      const mockLLMResponse = {
        valid: true,
        reply: "That makes sense.",
        isCrisis: false,
        suggestTherapy: false,
        sentiment: "SAD",
      };
      mockLLMService.processVentMessage.mockResolvedValue(mockLLMResponse);
      mockPersistenceService.getUserVentMemory.mockResolvedValue({ currentEma: -0.5 });
      // Enough depth, but therapy was already mentioned
      mockPersistenceService.getRecentMessages.mockResolvedValue([
        { role: "user", content: "I've been feeling terrible for weeks" },
        { role: "assistant", content: "Have you considered talking to a therapist about this?" },
        { role: "user", content: "Maybe" },
        { role: "assistant", content: "Take your time." },
        { role: "user", content: "Yeah still feeling low" },
        { role: "assistant", content: "That makes sense." },
      ]);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(
          true,
          200,
          "Vent Reply Successfully",
          expect.objectContaining({
            suggestTherapy: false,
          })
        )
      );
    });

    it("should skip EMA check entirely when LLM already set suggestTherapy to true", async () => {
      mockReq.body = {
        message: "I've been unable to sleep for months",
        sessionId: validSessionId,
      };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockResolvedValue([]);

      const mockLLMResponse = {
        valid: true,
        reply: "That sounds exhausting. This might be worth exploring with a professional.",
        isCrisis: false,
        suggestTherapy: true,
        sentiment: "SAD",
      };
      mockLLMService.processVentMessage.mockResolvedValue(mockLLMResponse);

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      // getRecentMessages should NOT be called since suggestTherapy is already true
      expect(mockPersistenceService.getRecentMessages).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(
          true,
          200,
          "Vent Reply Successfully",
          expect.objectContaining({
            suggestTherapy: true,
            platformUrl: expect.stringContaining("catalystcare"),
          })
        )
      );
    });

    it("should handle ApiError properly", async () => {
      mockReq.body = { message: "Hello", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockRejectedValue(
        new ApiError(403, "Forbidden resource")
      );

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(new ApiResponse(false, 403, "Forbidden resource"));
    });

    it("should handle generic errors by returning 500 status", async () => {
      mockReq.body = { message: "Hello", sessionId: validSessionId };
      mockPersistenceService.verifySessionOwner.mockResolvedValue(true);
      mockContextService.getContextMessages.mockRejectedValue(
        new Error("Database connection lost")
      );

      await controller.ventText(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(false, 500, "Something went wrong while fetching vent response")
      );
    });
  });

  describe("getInsight", () => {
    it("should generate and return an insight successfully if there is at least one user message", async () => {
      const mockUserMessages = [
        { role: "user", content: "Msg 1", createdAt: new Date() },
        { role: "assistant", content: "AI Msg 1", createdAt: new Date() },
      ];

      const mockInsight = {
        insight: "Mock insight details",
        type: "pattern",
        confidence: 0.9,
        evidence: ["Msg 1"],
        tone: "supportive",
      };

      mockPersistenceService.getMessagesInTimeWindow.mockResolvedValue(mockUserMessages);
      mockLLMService.generateInsight.mockResolvedValue(mockInsight);

      await controller.getInsight(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPersistenceService.getMessagesInTimeWindow).toHaveBeenCalledWith("user-123", 72);
      expect(mockLLMService.generateInsight).toHaveBeenCalledWith([
        { role: "user", content: "Msg 1", createdAt: expect.any(Date) },
      ]);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Insight generated successfully", mockInsight)
      );
    });

    it("should return 400 if user messages count is zero even after fallback", async () => {
      mockPersistenceService.getMessagesInTimeWindow.mockResolvedValue([]);
      mockPersistenceService.getRecentMessagesCrossSession.mockResolvedValue([]);

      await controller.getInsight(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 400,
          message: expect.stringContaining("No conversation history found"),
        })
      );
      expect(mockLLMService.generateInsight).not.toHaveBeenCalled();
    });

    it("should successfully fall back to recent cross-session messages if none in the last 72 hours", async () => {
      const mockInsight = {
        insight: "Insight based on older messages",
        type: "trend",
        confidence: 0.75,
        evidence: ["Older message"],
        tone: "reflective",
      };

      mockPersistenceService.getMessagesInTimeWindow.mockResolvedValue([]);
      mockPersistenceService.getRecentMessagesCrossSession.mockResolvedValue([
        { role: "user", content: "Older message", createdAt: new Date() },
        { role: "assistant", content: "Older reply", createdAt: new Date() },
      ]);
      mockLLMService.generateInsight.mockResolvedValue(mockInsight);

      await controller.getInsight(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPersistenceService.getMessagesInTimeWindow).toHaveBeenCalledWith("user-123", 72);
      expect(mockPersistenceService.getRecentMessagesCrossSession).toHaveBeenCalledWith(
        "user-123",
        20
      );
      expect(mockLLMService.generateInsight).toHaveBeenCalledWith([
        { role: "user", content: "Older message", createdAt: expect.any(Date) },
      ]);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Insight generated successfully", mockInsight)
      );
    });

    it("should handle ApiError properly", async () => {
      mockPersistenceService.getMessagesInTimeWindow.mockRejectedValue(
        new ApiError(403, "Forbidden resource")
      );

      await controller.getInsight(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(new ApiResponse(false, 403, "Forbidden resource"));
    });

    it("should handle generic errors by returning 500 status", async () => {
      mockPersistenceService.getMessagesInTimeWindow.mockRejectedValue(
        new Error("Database connection lost")
      );

      await controller.getInsight(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(false, 500, "Something went wrong while generating emotional insight")
      );
    });
  });
});
