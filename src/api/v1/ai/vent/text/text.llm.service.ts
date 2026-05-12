import { groqConfig } from "../../../../../shared/config/ai.config";
import { callGroq, safeParseJSON, GroqMessage } from "../../../../../infrastructure/groq";
import { LLMResponse } from "./text.types";

const BASE_SYSTEM_PROMPT = `You are Manasi, a compassionate AI companion on an Indian mental wellness platform. Your role is to provide a safe, non-judgmental space for users to express their feelings freely.

FIRST, assess if the user's message is meaningfully related to:
- Emotions, feelings, mental state
- Relationships (family, romantic, friendships, work)
- Stress, anxiety, overthinking, sadness, anger
- Life situations, personal struggles, self-worth
- Sleep, motivation, burnout, loneliness

If NOT related (e.g. code, trivia, homework), respond ONLY with this JSON:
{"valid": false, "message": "I'm here to support your emotional wellbeing. Feel free to share what's on your mind."}

If VALID, respond ONLY with this JSON:
{"valid": true, "reply": "<your_response_here>"}

Guidelines for reply:
- Validate feelings BEFORE offering perspective
- Be culturally aware — Indian family pressure, career stress, societal expectations are common
- Ask ONE thoughtful follow-up question
- Never diagnose or give medical advice
- If crisis or self-harm is mentioned, gently suggest a therapist on the platform
- Determine response language ONLY from the latest user message in this request.
- Ignore conversation history language for language selection.
- If latest message is clearly English, reply in English only.
- If latest message is clearly Hindi, reply in Hindi only.
- If latest message is mixed Hinglish, reply in Hinglish.
- If ambiguous, default to English.
- Never switch language unless the latest user message indicates it.

CRITICAL: Your entire response must be a single valid JSON object. No markdown, no preamble, nothing outside the JSON.`;

function buildSystemPrompt(userSummary: string | null): string {
  if (!userSummary) return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT}

--- WHAT YOU KNOW ABOUT THIS USER (from prior conversations) ---
${userSummary}
--- Use this to feel continuous and caring. Don't reference it directly unless natural. ---`;
}

export class VentLLMService {
  async processVentMessage(
    userMessage: string,
    conversationHistory: Pick<GroqMessage, "role" | "content">[],
    userSummary: string | null = null
  ): Promise<LLMResponse> {
    const messages: GroqMessage[] = [
      { role: "system", content: buildSystemPrompt(userSummary) },
      // conversationHistory roles are already "user" | "assistant" — cast is safe
      ...(conversationHistory as GroqMessage[]),
      { role: "user", content: userMessage },
    ];

    try {
      const raw = await callGroq({
        model: groqConfig.model,
        messages,
        temperature: 0.7,
        max_tokens: 512,
        response_format: { type: "json_object" },
      });

      const parsed = safeParseJSON<LLMResponse>(raw);

      if (typeof parsed.valid !== "boolean") {
        throw new Error("Unexpected LLM response shape");
      }

      return parsed;
    } catch (err) {
      // Log but don't crash the request — return a safe fallback
      console.error("[VentLLMService] processVentMessage error:", err);
      return {
        valid: true,
        reply:
          "I'm here with you. Sometimes putting feelings into words is the hardest part. Would you like to share a little more about what's going on?",
      };
    }
  }
}