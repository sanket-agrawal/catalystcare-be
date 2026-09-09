import { describe, expect, it } from "vitest";
import { safeParseJSON } from "./index";

describe("safeParseJSON", () => {
  it("parses clean JSON objects directly", () => {
    const raw = JSON.stringify({ insight: "stressed", confidence: 0.9 });
    const parsed = safeParseJSON<{ insight: string; confidence: number }>(raw);
    expect(parsed).toEqual({ insight: "stressed", confidence: 0.9 });
  });

  it("parses markdown fenced JSON", () => {
    const raw = '```json\n{"insight": "stressed", "confidence": 0.9}\n```';
    const parsed = safeParseJSON<{ insight: string; confidence: number }>(raw);
    expect(parsed).toEqual({ insight: "stressed", confidence: 0.9 });
  });

  it("parses JSON with conversational preambles from LLMs", () => {
    const raw = `Here is the emotional insight you requested:
\`\`\`json
{
  "insight": "Frequent stress after evening meetings",
  "confidence": 0.85
}
\`\`\`
Hope this helps!`;
    const parsed = safeParseJSON<{ insight: string; confidence: number }>(raw);
    expect(parsed.insight).toBe("Frequent stress after evening meetings");
    expect(parsed.confidence).toBe(0.85);
  });

  it("parses JSON when there is text before the opening brace without fences", () => {
    const raw = 'Here is the JSON response: {"valid": true, "reply": "Hello"}';
    const parsed = safeParseJSON<{ valid: boolean; reply: string }>(raw);
    expect(parsed).toEqual({ valid: true, reply: "Hello" });
  });

  it("throws a SyntaxError when string contains no valid JSON", () => {
    expect(() => safeParseJSON("This is purely plain text without json")).toThrow();
  });
});
