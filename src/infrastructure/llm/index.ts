import { llmConfig } from "../../shared/config/ai.config";

const LLM_API_URL = llmConfig.apiUrl;
const LLM_TIMEOUT_MS = llmConfig.timeoutMs;

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequestOptions {
  model?: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
}

/**
 * Strips markdown fences in case a model ignores response_format: json_object.
 * Safe to call even when content is already clean JSON.
 */
export function safeParseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/^```json\s*|^```\s*|```\s*$/gm, "").trim();
  return JSON.parse(cleaned) as T;
}

/**
 * Shared LLM fetch wrapper used by all services.
 * Provider-agnostic — works with any OpenAI-compatible API (Cerebras, Groq, Together, etc.)
 * Returns the raw string content of choices[0].message.content.
 * Throws on HTTP errors, empty responses, and timeouts.
 */
export async function callLLM(options: LLMRequestOptions): Promise<string> {
  const apiKey = llmConfig.apiKey;
  if (!apiKey) throw new Error("LLM API key is not set (check CEREBRAS_API_KEY)");

  const model = options.model ?? llmConfig.textModel ?? "gpt-oss-120b";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  const startTime = Date.now();

  try {
    const res = await fetch(LLM_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 512,
        ...(options.response_format && { response_format: options.response_format }),
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as any;
      throw new Error(`LLM API error ${res.status}: ${err?.error?.message ?? "unknown"}`);
    }

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    const elapsed = Date.now() - startTime;

    console.log(`[LLM] ${model} → ${elapsed}ms`);

    if (!content) throw new Error("Empty response from LLM");

    return content;
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    if (err.name === "AbortError")
      throw new Error(`LLM request timed out after ${LLM_TIMEOUT_MS / 1000}s`);
    console.error(`[LLM] ${model} failed after ${elapsed}ms:`, err.message);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Backward-compatible aliases (to ease migration) ──────────────────
// These re-exports allow existing imports from "infrastructure/groq" to
// keep working until all call-sites are updated.
export type GroqMessage = LLMMessage;
export type GroqRequestOptions = LLMRequestOptions;
export const callGroq = callLLM;
