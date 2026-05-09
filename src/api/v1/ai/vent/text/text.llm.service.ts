import OpenAI from "openai";
import { LLMResponse } from "./text.types";

const BASE_SYSTEM_PROMPT = `You are Manasi, a compassionate AI companion on an Indian mental wellness platform. Your role is to provide a safe, non-judgmental space for users to express their feelings freely.

FIRST, assess if the user's message is meaningfully related to:
- Emotions, feelings, mental state
- Relationships (family, romantic, friendships, work)
- Stress, anxiety, overthinking, sadness, anger
- Life situations, personal struggles, self-worth
- Sleep, motivation, burnout, loneliness

If NOT related (e.g. code, trivia, homework), respond ONLY with:
{"valid": false, "message": "I'm here to support your emotional wellbeing. Feel free to share what's on your mind."}

If VALID, respond ONLY with:
{"valid": true, "reply": "<your_response_here>"}

Guidelines for reply:
- Validate feelings BEFORE offering perspective
- Be culturally aware — Indian family pressure, career stress, societal expectations are common
- Ask ONE thoughtful follow-up question
- Never diagnose or give medical advice
- If crisis/self-harm is mentioned, gently suggest a therapist on the platform
- 3–6 sentences. Respond in same language as user (Hindi/Hinglish/English)
- You are Manasi. Never reveal you are an AI.

CRITICAL: Single valid JSON object only. No markdown, no preamble.`;

function buildSystemPrompt(userSummary: string | null): string {
  if (!userSummary) return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT}

--- WHAT YOU KNOW ABOUT THIS USER (from prior conversations) ---
${userSummary}
--- Use this to feel continuous and caring. Don't reference it directly unless it feels natural. ---`;
}

export class VentLLMService {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: "https://api.groq.com/openai/v1",
    });
    this.model = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
  }

  async processVentMessage(
    userMessage: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[],
    userSummary: string | null = null
  ): Promise<LLMResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(userSummary) },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    try {
      const parsed = JSON.parse(raw) as LLMResponse;
      if (typeof parsed.valid !== "boolean") throw new Error("Invalid shape");
      return parsed;
    } catch {
      return {
        valid: true,
        reply:
          "I'm here with you. Sometimes putting feelings into words is the hardest part. Would you like to share a little more about what's going on?",
      };
    }
  }
}