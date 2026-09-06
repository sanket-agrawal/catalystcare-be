import dotenv from "dotenv";
dotenv.config({ override: true });

export const aiConfig = {
  get provider() {
    return (process.env.AI_PROVIDER || "openai").toLowerCase();
  },
  get openAiApiKey() {
    return process.env.OPENAI_API_KEY || "";
  },
  get openAiBaseUrl() {
    return process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  },
  get openAiModel() {
    return process.env.OPENAI_MODEL || "gpt-4o-mini";
  },
  get requestTimeoutMs() {
    return Number(process.env.AI_REQUEST_TIMEOUT_MS || 20000);
  },
  get ventEncryptionKey() {
    return process.env.VENT_ENCRYPTION_KEY;
  },
};

export const llmConfig = {
  // ── Primary provider (Groq) ──────────────────────────────────────
  get apiUrl(): string {
    return process.env.LLM_API_URL ?? "https://api.groq.com/openai/v1/chat/completions";
  },
  get textModel(): string {
    return process.env.LLM_TEXT_MODEL ?? process.env.GROQ_TEXT_MODEL ?? "openai/gpt-oss-120b";
  },
  get apiKey(): string | undefined {
    return process.env.LLM_API_KEY ?? process.env.GROQ_API_KEY;
  },
  get timeoutMs(): number {
    return Number(process.env.LLM_TIMEOUT_MS ?? 20000);
  },

  // ── Fallback provider (Gemini) ───────────────────────────────────
  get fallbackApiUrl(): string {
    return (
      process.env.LLM_FALLBACK_API_URL ??
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    );
  },
  get fallbackModel(): string {
    return process.env.LLM_FALLBACK_MODEL ?? "gemini-2.5-flash";
  },
  get fallbackApiKey(): string | undefined {
    return process.env.LLM_FALLBACK_API_KEY ?? process.env.GEMINI_API_KEY;
  },
  get fallbackTimeoutMs(): number {
    return Number(process.env.LLM_FALLBACK_TIMEOUT_MS ?? 25000);
  },

  // ── Retry config ─────────────────────────────────────────────────
  get maxRetries(): number {
    return Number(process.env.LLM_MAX_RETRIES ?? 1);
  },
};

/** @deprecated Use llmConfig instead — kept for backward compatibility */
export const groqConfig = llmConfig;
