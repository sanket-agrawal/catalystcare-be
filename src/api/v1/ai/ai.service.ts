import { ToolName, VentTextRequestDto, VentVoiceRequestDto } from "./ai.dto";
import { aiConfig } from "../../../shared/config/ai.config";

const DEFAULT_BREATHING_SCRIPT =
  "Sit comfortably, relax your shoulders, and inhale for 4 counts. Hold for 4, then exhale for 6. Repeat this cycle for 2 minutes while gently noticing your breath.";

const DEFAULT_POMODORO_TIPS = [
  "25 minutes deep work",
  "5 minutes short break",
  "After 4 cycles, take a 15-20 minute long break",
];

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const SUPPORT_SYSTEM_PROMPT = `You are a warm, emotionally safe mental wellness companion.
Goals:
- Help the user vent and feel heard.
- Reflect feelings without judgment.
- Ask one gentle follow-up question when appropriate.
- Keep responses concise (2-5 short lines).
- Never diagnose or claim to be a therapist.
- If user expresses self-harm intent or immediate danger, respond with empathy and encourage contacting local emergency services or a trusted person immediately.`;

const TOOL_SYSTEM_PROMPT = `You are an assistant for wellbeing micro-tools.
Rules:
- Be direct and practical.
- Keep output concise and usable.
- For meditation: provide a short guided script.
- For joke: provide one clean, light joke.
- For pomodoro: provide actionable cycle guidance.`;

async function generateWithLLM(messages: ChatMessage[], maxTokens = 220) {
  if (aiConfig.provider !== "openai") {
    throw new Error(`Unsupported AI provider: ${aiConfig.provider}`);
  }

  if (!aiConfig.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);

  try {
    const response = await fetch(`${aiConfig.openAiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.openAiModel,
        temperature: 0.7,
        max_tokens: maxTokens,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const output = data?.choices?.[0]?.message?.content?.trim();
    if (!output) throw new Error("LLM returned empty response");

    return output;
  } finally {
    clearTimeout(timeout);
  }
}

export const aiService = {
  async processVentText(payload: VentTextRequestDto) {
    const cleanedMessage = payload.message.trim();
    let llmResponse = "";

    try {
      llmResponse = await generateWithLLM(
        [
          { role: "system", content: SUPPORT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Channel: ${payload.channel || "web"}\nUser message: ${cleanedMessage}`,
          },
        ],
        260
      );
    } catch {
      llmResponse =
        "I hear you. It sounds like this has been heavy for you. I'm here with you - what part of this feels the hardest right now?";
    }

    return {
      type: "vent_response",
      tone: "empathetic",
      response: llmResponse,
      metadata: {
        originalLength: cleanedMessage.length,
        channel: payload.channel || "web",
        model: aiConfig.openAiModel,
      },
    };
  },

  async processVentVoice(payload: VentVoiceRequestDto) {
    const transcript = payload.transcript?.trim();

    // Keep the endpoint stable while speech-to-text provider integration is pending.
    const normalizedTranscript =
      transcript || "Voice note received. (Transcript unavailable)";
    let llmResponse = "";

    try {
      llmResponse = await generateWithLLM(
        [
          { role: "system", content: SUPPORT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `User shared a voice note transcript:\n${normalizedTranscript}`,
          },
        ],
        260
      );
    } catch {
      llmResponse =
        "Thanks for sharing that voice note. I know saying this out loud can be hard. I'm here - what happened just before you started feeling this way?";
    }

    return {
      type: "voice_vent_response",
      transcript: normalizedTranscript,
      response: llmResponse,
      metadata: {
        hasAudioUrl: Boolean(payload.audioUrl),
        hasTranscript: Boolean(transcript),
        channel: payload.channel || "web",
        model: aiConfig.openAiModel,
      },
    };
  },

  async executeTool(tool: ToolName, input?: string) {
    if (tool === "meditate" || tool === "joke" || tool === "pomodoro" || tool === "vent") {
      try {
        const promptByTool: Record<ToolName, string> = {
          meditate: `Create a 2-minute grounding meditation script. Context: ${input || "general stress relief"}`,
          joke: `Tell one short, clean joke. Optional theme: ${input || "general"}`,
          pomodoro: `Give a concise pomodoro plan for this task: ${input || "focus work"}. Include cycle and break tips.`,
          vent: `User wants to vent. Reply with empathy and one gentle follow-up question. Context: ${input || "no extra context"}`,
        };

        const llmText = await generateWithLLM(
          [
            { role: "system", content: TOOL_SYSTEM_PROMPT },
            { role: "user", content: promptByTool[tool] },
          ],
          200
        );

        if (tool === "pomodoro") {
          return {
            type: "tool_response",
            tool,
            response: llmText,
            config: {
              focusMinutes: 25,
              shortBreakMinutes: 5,
              longBreakMinutes: 20,
              tips: DEFAULT_POMODORO_TIPS,
            },
          };
        }

        return {
          type: "tool_response",
          tool,
          response: llmText,
        };
      } catch {
        // Fall back to deterministic responses below.
      }
    }

    switch (tool) {
      case "meditate":
        return {
          type: "tool_response",
          tool,
          title: "2-Minute Grounding Practice",
          response: input
            ? `${DEFAULT_BREATHING_SCRIPT} If your mind wanders to "${input}", gently bring attention back to your breath.`
            : DEFAULT_BREATHING_SCRIPT,
        };
      case "joke":
        return {
          type: "tool_response",
          tool,
          response:
            "Why don't programmers like nature? It has too many bugs.",
        };
      case "pomodoro":
        return {
          type: "tool_response",
          tool,
          response: "Pomodoro routine started.",
          config: {
            focusMinutes: 25,
            shortBreakMinutes: 5,
            longBreakMinutes: 20,
            tips: DEFAULT_POMODORO_TIPS,
          },
        };
      case "vent":
        return {
          type: "tool_response",
          tool,
          response:
            "I'm here to listen. Share whatever is on your mind, no pressure.",
        };
      default:
        return {
          type: "tool_response",
          tool,
          response: "Tool not supported yet.",
        };
    }
  },
};
