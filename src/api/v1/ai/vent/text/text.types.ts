export interface VentMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface VentSession {
  sessionId: string;
  userId: string;
  messages: VentMessage[];
  createdAt: number;
  lastActiveAt: number;
}

export interface LLMResponse {
  valid: boolean;
  reply?: string;
  message?: string;
}

export interface VentTextRequest {
  message: string;
  sessionId: string; // required now — client must create session first
}

export interface VentTextResponse {
  sessionId: string;
  reply: string;
  isValid: boolean;
}

export interface VentSessionPreview {
  sessionId: string;
  title: string;       // first user message, truncated
  preview: string;     // last message, truncated
  lastActiveAt: Date;
  startedAt: Date;
  messageCount: number;
}