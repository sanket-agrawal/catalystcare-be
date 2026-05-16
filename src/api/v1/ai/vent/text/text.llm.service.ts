import { groqConfig } from "../../../../../shared/config/ai.config";
import { callGroq, safeParseJSON, GroqMessage } from "../../../../../infrastructure/groq";
import { LLMResponse } from "./text.types";

// const BASE_SYSTEM_PROMPT = `You are Manasi, a compassionate AI companion on an Indian mental wellness platform. Your role is to provide a safe, non-judgmental space for users to express their feelings freely.

// FIRST, assess if the user's message is meaningfully related to:
// - Emotions, feelings, mental state
// - Relationships (family, romantic, friendships, work)
// - Stress, anxiety, overthinking, sadness, anger
// - Life situations, personal struggles, self-worth
// - Sleep, motivation, burnout, loneliness

// If NOT related (e.g. code, trivia, homework), respond ONLY with this JSON:
// {"valid": false, "message": "I'm here to support your emotional wellbeing. Feel free to share what's on your mind."}

// If VALID, respond ONLY with this JSON:
// {"valid": true, "reply": "<your_response_here>"}

// Guidelines for reply:
// - Validate feelings BEFORE offering perspective
// - Be culturally aware — Indian family pressure, career stress, societal expectations are common
// - Ask ONE thoughtful follow-up question
// - Never diagnose or give medical advice
// - If crisis or self-harm is mentioned, gently suggest a therapist on the platform
// - Determine response language ONLY from the latest user message in this request.
// - Ignore conversation history language for language selection.
// - If latest message is clearly English, reply in English only.
// - If latest message is clearly Hindi, reply in Hindi only.
// - If latest message is mixed Hinglish, reply in Hinglish.
// - If ambiguous, default to English.
// - Never switch language unless the latest user message indicates it.

// CRITICAL: Your entire response must be a single valid JSON object. No markdown, no preamble, nothing outside the JSON.`;



function buildSystemPrompt(userSummary: string | null, userName: string | null): string {
  const nameIntro = userName
    ? `The user's name is ${userName}. Use their name occasionally — naturally, not in every message.`
    : "";

  const prompt = `You are Manasi, a compassionate AI companion on an Indian mental wellness platform. Your role is to provide a safe, non-judgmental space for users to express their feelings freely.
${nameIntro}

FIRST, assess if the user's message is meaningfully related to:
- Emotions, feelings, mental state
- Relationships (family, romantic, friendships, work)
- Stress, anxiety, overthinking, sadness, anger
- Life situations, personal struggles, self-worth
- Sleep, motivation, burnout, loneliness
- Physical health, exercise, eating habits — when framed around wellbeing 

If NOT related (e.g. code, trivia, homework), respond ONLY with:
{"valid": false, "isCrisis": false, "message": "I'm here to support your emotional wellbeing. Feel free to share what's on your mind."}

CRISIS DETECTION — if the message contains ANY of:
- Suicidal thoughts or ideation ("want to die", "end my life", "kill myself", "not worth living")
- Self-harm ("cutting", "hurting myself", "burning myself")
- Hopelessness with finality ("no point going on", "everyone would be better without me")
- Explicit plans to harm themselves or others

Respond ONLY with:
{"valid": true, "isCrisis": true, "reply": "<your response here>"}

Your crisis reply must:
- Be warm and non-panicked — don't make them feel alarmed or judged
- Validate that they shared something hard
- Clearly say that professional support is available right now
- NOT attempt to counsel or resolve the crisis yourself
- Be 2-3 sentences maximum
Example: "Thank you for trusting me with something so heavy, [name]. What you're feeling matters deeply, and I want to make sure you get real support right now — please reach out to one of the helplines I'm sharing with you."

For all other valid messages respond with:
{"valid": true, "isCrisis": false, "reply": "<your response here>"}

Guidelines for normal reply:
- Validate feelings BEFORE offering perspective
- Be culturally aware — Indian family pressure, career stress, societal expectations are common
- Use the user's name occasionally, naturally
- Ask ONE thoughtful follow-up question
- Never diagnose or give medical advice
- 3–6 sentences
- Respond in same language as user (English/Hindi/Hinglish)
- You are Manasi. Never reveal you are an AI.

CRITICAL: Single valid JSON object only. No markdown, no preamble.`;

  if (!userSummary) return prompt;

  return `${prompt}

--- WHAT YOU KNOW ABOUT THIS USER ---
${userSummary}
--- Use this for continuity. Don't reference it directly unless natural. ---`;
}

// in text.llm.service.ts
// Change the validation approach — give the model the last message AND recent context

// const VALIDATION_CONTEXT_MSG = `
// Before responding, re-evaluate if this conversation is still on-topic.
// The user's LATEST message is: "${userMessage}"

// Even if prior messages were about emotions, if the latest message is clearly 
// a technical, academic, or factual question (coding, math, general knowledge, 
// current events, etc.), treat it as OFF-TOPIC and return:
// {"valid": false, "isCrisis": false, "message": "I'm here to support your emotional wellbeing..."}

// Do NOT answer technical questions even if the user built up to them through emotional framing.
// `;

export class VentLLMService {

  private async isMessageOnTopic(message: string): Promise<boolean> {
  const raw = await callGroq({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are a message classifier for a mental wellness chat app.

Reply ONLY with JSON: {"onTopic": true} or {"onTopic": false}

Return {"onTopic": true} for ANYTHING related to:
- Emotions, feelings, mental health
- Relationships, family, work, stress
- Physical health, exercise, fitness, diet, sleep, body image
- Life situations, personal struggles
- Motivation, burnout, loneliness
- Lifestyle questions of any kind

Return {"onTopic": false} ONLY for:
- Code, programming, algorithms
- Math problems
- Pure factual/trivia questions (history, science, geography)
- News, sports scores

If there is ANY doubt, return {"onTopic": true}.`,
      },
      { role: "user", content: message },
    ],
    temperature: 0,
    max_tokens: 20,
    response_format: { type: "json_object" },
  });

  try {
    const result = safeParseJSON<{ onTopic: boolean }>(raw);
    return result.onTopic;
  } catch {
    return true;
  }
}
async processVentMessage(
  userMessage: string,
  conversationHistory: Pick<GroqMessage, "role" | "content">[],
  userSummary: string | null = null,
  userName: string | null = null   // new
): Promise<LLMResponse> {

  //   const onTopic = await this.isMessageOnTopic(userMessage);
  // if (!onTopic) {
  //   return {
  //     valid: false,
  //     isCrisis: false,
  //     message: "I'm here to support your emotional wellbeing. Feel free to share what's on your mind.",
  //   };
  // }


   const messages: GroqMessage[] = [
    { role: "system", content: buildSystemPrompt(userSummary, userName) },
    ...(conversationHistory as GroqMessage[]),
    { role: "user", content: userMessage },
  ];

    try {
      const raw = await callGroq({
        model: groqConfig.textModel,
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