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
  isCrisis?: boolean; 
}

export interface VentTextRequest {
  message: string;
  sessionId: string; // required now — client must create session first
}

export interface VentTextResponse {
  sessionId: string;
  reply: string;
  isValid: boolean;
  isCrisis: boolean;    // new — FE uses this to show helpline UI
  helplines?: Helpline[]; // new — only present when isCrisis true
}

export interface VentSessionPreview {
  sessionId: string;
  title: string;       // first user message, truncated
  preview: string;     // last message, truncated
  lastActiveAt: Date;
  startedAt: Date;
  messageCount: number;
}

export interface Helpline {
  name: string;
  number: string;
  available: string;
}