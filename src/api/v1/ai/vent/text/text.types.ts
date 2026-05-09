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
  sessionId?: string; // optional; new session created if absent
}

export interface VentTextResponse {
  success: boolean;
  sessionId: string;
  reply: string;
  isValid: boolean;
}