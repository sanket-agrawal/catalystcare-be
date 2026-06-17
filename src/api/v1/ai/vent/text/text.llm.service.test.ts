import { describe, expect, it, vi, beforeEach } from "vitest";
import { VentLLMService } from "./text.llm.service";
import { callLLM, safeParseJSON } from "../../../../../infrastructure/llm";

vi.mock("../../../../../infrastructure/llm", () => {
  return {
    callLLM: vi.fn(),
    safeParseJSON: vi.fn((raw: string) => JSON.parse(raw)),
  };
});

describe("VentLLMService", () => {
  let llmService: VentLLMService;

  beforeEach(() => {
    vi.clearAllMocks();
    llmService = new VentLLMService();
  });

  describe("processVentMessage", () => {
    it("should process user message and return parsed LLM response", async () => {
      const mockLLMResponse = {
        valid: true,
        reply: "I understand how you feel.",
        isCrisis: false,
        suggestTherapy: false,
      };

      vi.mocked(callLLM).mockResolvedValue(JSON.stringify(mockLLMResponse));

      const response = await llmService.processVentMessage(
        "I am feeling stressed today.",
        [{ role: "user", content: "hello" }],
        "User is stressed about work.",
        "Sanket"
      );

      expect(callLLM).toHaveBeenCalledTimes(1);

      const callArgs = vi.mocked(callLLM).mock.calls[0][0];
      expect(callArgs.messages).toBeDefined();
      expect(callArgs.messages.length).toBe(3); // system, history, user message
      expect(callArgs.messages[0].role).toBe("system");
      expect(callArgs.messages[0].content).toContain("Sanket");
      expect(callArgs.messages[0].content).toContain("User is stressed about work.");
      expect(callArgs.messages[1]).toEqual({ role: "user", content: "hello" });
      expect(callArgs.messages[2]).toEqual({
        role: "user",
        content: "I am feeling stressed today.",
      });

      expect(response).toEqual(mockLLMResponse);
    });

    it("should handle error in callLLM and return a safe fallback response", async () => {
      vi.mocked(callLLM).mockRejectedValue(new Error("LLM API rate limit or outage"));

      const response = await llmService.processVentMessage("I am feeling stressed today.", []);

      expect(response).toEqual({
        valid: true,
        reply: "Hmm, something didn't quite go through on my end. Want to try saying that again?",
      });
    });

    it("should handle invalid JSON from LLM and return fallback response", async () => {
      vi.mocked(callLLM).mockResolvedValue("invalid json string");
      vi.mocked(safeParseJSON).mockImplementationOnce(() => {
        throw new Error("Parsing failed");
      });

      const response = await llmService.processVentMessage("Hello", []);

      expect(response).toEqual({
        valid: true,
        reply: "Hmm, something didn't quite go through on my end. Want to try saying that again?",
      });
    });

    it("should fallback if returned JSON does not have 'valid' property as boolean", async () => {
      vi.mocked(callLLM).mockResolvedValue(JSON.stringify({ reply: "Missing valid field" }));
      vi.mocked(safeParseJSON).mockReturnValue({ reply: "Missing valid field" } as any);

      const response = await llmService.processVentMessage("Hello", []);

      expect(response).toEqual({
        valid: true,
        reply: "Hmm, something didn't quite go through on my end. Want to try saying that again?",
      });
    });
  });

  describe("generateInsight", () => {
    const sampleMessages = [
      { content: "Message 1", createdAt: new Date("2026-06-17T10:00:00Z") },
      { content: "Message 2", createdAt: new Date("2026-06-17T11:00:00Z") },
    ];

    it("should generate and return a valid emotional insight", async () => {
      const mockInsight = {
        insight: "You seem to experience anxiety after work.",
        type: "pattern",
        confidence: 0.85,
        evidence: ["User mentioned stress post work"],
        tone: "reflective",
      };

      vi.mocked(callLLM).mockResolvedValue(JSON.stringify(mockInsight));
      vi.mocked(safeParseJSON).mockReturnValue(mockInsight as any);

      const response = await llmService.generateInsight(sampleMessages);

      expect(callLLM).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(callLLM).mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain("You are an emotional pattern analyst");
      expect(callArgs.messages[1].content).toContain("Message 1");
      expect(response).toEqual(mockInsight);
    });

    it("should throw an error if the LLM output is malformed or invalid", async () => {
      const malformedInsight = {
        insight: 123, // should be string
        type: "invalid_type",
        confidence: "high",
      };

      vi.mocked(callLLM).mockResolvedValue(JSON.stringify(malformedInsight));
      vi.mocked(safeParseJSON).mockReturnValue(malformedInsight as any);

      await expect(llmService.generateInsight(sampleMessages)).rejects.toThrow(
        "Invalid insight response format from LLM"
      );
    });
  });
});
