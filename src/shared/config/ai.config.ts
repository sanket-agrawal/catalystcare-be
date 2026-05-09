import dotenv from "dotenv";
dotenv.config();

export const aiConfig = {
  provider: (process.env.AI_PROVIDER || "openai").toLowerCase(),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 20000),
};
