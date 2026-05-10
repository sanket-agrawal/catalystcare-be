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
  message?: string; // returned when valid=false
}

export interface VentTextRequest {
  message: string;
  sessionId?: string; // optional; new session created if absent
}

export interface VentTextResponse {
  sessionId: string;
  reply: string;
  isValid: boolean;
}