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
        mockLLMResponse.reply
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
        })
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
});
