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
  apiUrl: process.env.LLM_API_URL ?? "https://api.cerebras.ai/v1/chat/completions",
  textModel: process.env.CEREBRAS_MODEL_ID ?? process.env.LLM_TEXT_MODEL ?? "gpt-oss-120b",
  apiKey: process.env.CEREBRAS_API_KEY ?? process.env.LLM_API_KEY,
  timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 20000),
};

/** @deprecated Use llmConfig instead — kept for backward compatibility */
export const groqConfig = llmConfig;
