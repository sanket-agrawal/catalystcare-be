import { groqConfig } from "../../shared/config/ai.config";

const GROQ_API_URL = groqConfig.apiUrl;
const GROQ_TIMEOUT_MS = groqConfig.timeoutMs;

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqRequestOptions {
  model?: string;
  messages: GroqMessage[];
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
 * Shared Groq fetch wrapper used by all services.
 * Returns the raw string content of choices[0].message.content.
 * Throws on HTTP errors, empty responses, and timeouts.
 */
export async function callGroq(options: GroqRequestOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const model = options.model ?? groqConfig.textModel ?? "llama-3.3-70b-versatile";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API_URL, {
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
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(`Groq API error ${res.status}: ${err?.error?.message ?? "unknown"}`);
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from Groq");

    return content;
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("Groq request timed out after 15s");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}