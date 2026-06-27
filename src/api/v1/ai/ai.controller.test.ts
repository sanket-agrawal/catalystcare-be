import { describe, expect, it, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { aiController } from "./ai.controller";
import { aiService } from "./ai.service";
import ApiResponse from "../../../shared/utils/ApiResponse";

vi.mock("./ai.service", () => ({
  aiService: {
    processVentText: vi.fn(),
    processVentVoice: vi.fn(),
    executeTool: vi.fn(),
  },
}));

describe("aiController", () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  // ── ventText ──────────────────────────────────────────────────

  describe("ventText", () => {
    it("should return 400 if message is missing", async () => {
      const req = { body: {} } as Request;

      await aiController.ventText(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(new ApiResponse(false, 400, "message is required"));
    });

    it("should return 400 if message is empty string", async () => {
      const req = { body: { message: "   " } } as Request;

      await aiController.ventText(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(new ApiResponse(false, 400, "message is required"));
    });

    it("should process valid vent text and return 200", async () => {
      const mockResult = {
        type: "vent_response",
        tone: "empathetic",
        response: "I understand.",
        metadata: { originalLength: 16, channel: "web", model: "gpt-4" },
      };
      vi.mocked(aiService.processVentText).mockResolvedValue(mockResult);

      const req = { body: { message: "I feel stressed", channel: "web" } } as Request;
      await aiController.ventText(req, mockRes as Response);

      expect(aiService.processVentText).toHaveBeenCalledWith({
        message: "I feel stressed",
        channel: "web",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Vent text processed successfully", mockResult)
      );
    });

    it("should return 500 on service error", async () => {
      vi.mocked(aiService.processVentText).mockRejectedValue(new Error("LLM provider is down"));

      const req = { body: { message: "Hello" } } as Request;
      await aiController.ventText(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(false, 500, "LLM provider is down")
      );
    });
  });

  // ── ventVoice ─────────────────────────────────────────────────

  describe("ventVoice", () => {
    it("should return 400 if neither transcript nor audioUrl is provided", async () => {
      const req = { body: {} } as Request;

      await aiController.ventVoice(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(false, 400, "transcript or audioUrl is required")
      );
    });

    it("should process valid voice vent with transcript", async () => {
      const mockResult = {
        type: "voice_vent_response",
        transcript: "I feel tired",
        response: "That makes sense.",
        metadata: { hasAudioUrl: false, hasTranscript: true, channel: "web", model: "gpt-4" },
      };
      vi.mocked(aiService.processVentVoice).mockResolvedValue(mockResult);

      const req = { body: { transcript: "I feel tired" } } as Request;
      await aiController.ventVoice(req, mockRes as Response);

      expect(aiService.processVentVoice).toHaveBeenCalledWith({ transcript: "I feel tired" });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Vent voice processed successfully", mockResult)
      );
    });

    it("should process voice vent with audioUrl only", async () => {
      const mockResult = {
        type: "voice_vent_response",
        transcript: "Voice note received. (Transcript unavailable)",
        response: "I'm listening.",
        metadata: {
          hasAudioUrl: true,
          hasTranscript: false,
          channel: "web",
          model: "gpt-4",
        },
      };
      vi.mocked(aiService.processVentVoice).mockResolvedValue(mockResult);

      const req = {
        body: { audioUrl: "https://storage.example.com/voice.mp3" },
      } as Request;
      await aiController.ventVoice(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on service error", async () => {
      vi.mocked(aiService.processVentVoice).mockRejectedValue(new Error("Transcription failed"));

      const req = { body: { transcript: "test" } } as Request;
      await aiController.ventVoice(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(false, 500, "Transcription failed")
      );
    });
  });

  // ── runTool ───────────────────────────────────────────────────

  describe("runTool", () => {
    it("should return 400 if tool is missing", async () => {
      const req = { body: {} } as Request;

      await aiController.runTool(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(new ApiResponse(false, 400, "tool is required"));
    });

    it("should execute meditate tool successfully", async () => {
      const mockResult = {
        type: "tool_response",
        tool: "meditate",
        response: "Close your eyes...",
      };
      vi.mocked(aiService.executeTool).mockResolvedValue(mockResult);

      const req = { body: { tool: "meditate", input: "work stress" } } as Request;
      await aiController.runTool(req, mockRes as Response);

      expect(aiService.executeTool).toHaveBeenCalledWith("meditate", "work stress");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Tool executed successfully", mockResult)
      );
    });

    it("should execute joke tool without input", async () => {
      const mockResult = {
        type: "tool_response",
        tool: "joke",
        response: "Why don't programmers like nature?",
      };
      vi.mocked(aiService.executeTool).mockResolvedValue(mockResult);

      const req = { body: { tool: "joke" } } as Request;
      await aiController.runTool(req, mockRes as Response);

      expect(aiService.executeTool).toHaveBeenCalledWith("joke", undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should execute pomodoro tool and include config", async () => {
      const mockResult = {
        type: "tool_response",
        tool: "pomodoro",
        response: "Focus for 25 mins.",
        config: {
          focusMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 20,
          tips: ["25 minutes deep work"],
        },
      };
      vi.mocked(aiService.executeTool).mockResolvedValue(mockResult);

      const req = { body: { tool: "pomodoro", input: "study math" } } as Request;
      await aiController.runTool(req, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        new ApiResponse(true, 200, "Tool executed successfully", mockResult)
      );
    });

    it("should return 500 on service error", async () => {
      vi.mocked(aiService.executeTool).mockRejectedValue(new Error("Provider timeout"));

      const req = { body: { tool: "meditate" } } as Request;
      await aiController.runTool(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(new ApiResponse(false, 500, "Provider timeout"));
    });
  });
});
