import { llmConfig } from "../../shared/config/ai.config";

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

// ── Provider config types ────────────────────────────────────────────

interface ProviderConfig {
  name: string;
  apiUrl: string;
  apiKey: string | undefined;
  model: string;
  timeoutMs: number;
}

function getPrimaryProvider(): ProviderConfig {
  return {
    name: "groq",
    apiUrl: llmConfig.apiUrl,
    apiKey: llmConfig.apiKey,
    model: llmConfig.textModel,
    timeoutMs: llmConfig.timeoutMs,
  };
}

function getFallbackProvider(): ProviderConfig | null {
  if (!llmConfig.fallbackApiKey) return null;
  return {
    name: "gemini",
    apiUrl: llmConfig.fallbackApiUrl,
    apiKey: llmConfig.fallbackApiKey,
    model: llmConfig.fallbackModel,
    timeoutMs: llmConfig.fallbackTimeoutMs,
  };
}

// ── Core fetch for a single provider ─────────────────────────────────

async function fetchFromProvider(
  provider: ProviderConfig,
  options: LLMRequestOptions
): Promise<string> {
  const model = options.model ?? provider.model;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), provider.timeoutMs);
  const startTime = Date.now();

  try {
    const res = await fetch(provider.apiUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 512,
        ...(options.response_format && {
          response_format: options.response_format,
        }),
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as any;
      throw new Error(`LLM API error ${res.status}: ${err?.error?.message ?? "unknown"}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    const elapsed = Date.now() - startTime;

    console.log(`[LLM] ${provider.name}/${model} → ${elapsed}ms`);

    if (!content) throw new Error("Empty response from LLM");

    return content;
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    if (err.name === "AbortError")
      throw new Error(`LLM request timed out after ${provider.timeoutMs / 1000}s`);
    console.error(`[LLM] ${provider.name}/${model} failed after ${elapsed}ms:`, err.message);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Helper: retry with delay ─────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shared LLM fetch wrapper used by all services.
 * Provider-agnostic — works with any OpenAI-compatible API.
 *
 * Strategy:
 *  1. Try primary provider (Groq) with up to N retries
 *  2. If all retries fail and a fallback (Gemini) is configured, try it once
 *  3. If everything fails, throw the last error
 *
 * Returns the raw string content of choices[0].message.content.
 */
export async function callLLM(options: LLMRequestOptions): Promise<string> {
  const primary = getPrimaryProvider();
  if (!primary.apiKey)
    throw new Error("LLM API key is not set (check GROQ_API_KEY or LLM_API_KEY)");

  const maxRetries = llmConfig.maxRetries;
  let lastError: Error | null = null;

  // ── Try primary provider (with retries) ──
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFromProvider(primary, options);
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const backoff = 500 * (attempt + 1); // 500ms, 1000ms, ...
        console.warn(
          `[LLM] Primary (${primary.name}) attempt ${attempt + 1} failed, retrying in ${backoff}ms...`
        );
        await delay(backoff);
      }
    }
  }

  // ── Try fallback provider ──
  const fallback = getFallbackProvider();
  if (fallback) {
    console.warn(
      `[LLM] Primary (${primary.name}) exhausted ${maxRetries + 1} attempts. Falling back to ${fallback.name}...`
    );
    try {
      // For fallback, use its own model (not the model from options which may be primary-specific)
      const fallbackOptions = { ...options, model: fallback.model };
      return await fetchFromProvider(fallback, fallbackOptions);
    } catch (fallbackErr: any) {
      console.error(`[LLM] Fallback (${fallback.name}) also failed:`, fallbackErr.message);
      // Throw fallback error — it's the most recent
      throw fallbackErr;
    }
  }

  // No fallback configured — throw primary error
  throw lastError!;
}

// ── Backward-compatible aliases (to ease migration) ──────────────────
// These re-exports allow existing imports from "infrastructure/groq" to
// keep working until all call-sites are updated.
export type GroqMessage = LLMMessage;
export type GroqRequestOptions = LLMRequestOptions;
export const callGroq = callLLM;
