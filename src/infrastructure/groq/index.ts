/**
 * @deprecated – Import from "infrastructure/llm" instead.
 * This barrel re-exports everything so existing call-sites keep working.
 */
export {
  callLLM as callGroq,
  safeParseJSON,
  type LLMMessage as GroqMessage,
  type LLMRequestOptions as GroqRequestOptions,
  callLLM,
  type LLMMessage,
  type LLMRequestOptions,
} from "../llm";
