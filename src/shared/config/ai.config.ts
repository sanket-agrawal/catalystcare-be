import dotenv from "dotenv";
dotenv.config();

export const aiConfig = {
  provider: (process.env.AI_PROVIDER || "openai").toLowerCase(),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 20000),
  ventEncryptionKey: process.env.VENT_ENCRYPTION_KEY,
};

export const llmConfig = {
  // ── Primary provider (Groq) ──────────────────────────────────────
  apiUrl: process.env.LLM_API_URL ?? "https://api.groq.com/openai/v1/chat/completions",
  textModel: process.env.LLM_TEXT_MODEL ?? process.env.GROQ_TEXT_MODEL ?? "llama-3.3-70b-versatile",
  apiKey: process.env.LLM_API_KEY ?? process.env.GROQ_API_KEY,
  timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 20000),

  // ── Fallback provider (Gemini) ───────────────────────────────────
  fallbackApiUrl:
    process.env.LLM_FALLBACK_API_URL ??
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  fallbackModel: process.env.LLM_FALLBACK_MODEL ?? "gemini-2.5-flash",
  fallbackApiKey: process.env.LLM_FALLBACK_API_KEY ?? process.env.GEMINI_API_KEY,
  fallbackTimeoutMs: Number(process.env.LLM_FALLBACK_TIMEOUT_MS ?? 25000),

  // ── Retry config ─────────────────────────────────────────────────
  maxRetries: Number(process.env.LLM_MAX_RETRIES ?? 1),
};

/** @deprecated Use llmConfig instead — kept for backward compatibility */
export const groqConfig = llmConfig;
