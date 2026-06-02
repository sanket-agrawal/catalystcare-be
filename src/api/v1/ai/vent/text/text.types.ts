export interface VentMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isCrisis?: boolean;
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
  suggestTherapy?: boolean;
  sentiment?: string;
}

export interface VentTextRequest {
  message: string;
  sessionId: string; // required now — client must create session first
}

export interface SuggestedExercise {
  type: "breathing" | "grounding" | "mindfulness";
  title: string;
  instructions: string;
}

export interface VentTextResponse {
  sessionId: string;
  reply: string;
  isValid: boolean;
  isCrisis: boolean; // FE uses this to show helpline UI
  helplines?: Helpline[]; // only present when isCrisis true
  suggestTherapy: boolean; // true when AI thinks user should consider professional therapy
  platformUrl?: string; // CatalystCare URL — included when therapy is suggested
  sentiment?: string;
  suggestedExercise?: SuggestedExercise;
}

export interface VentSessionPreview {
  sessionId: string;
  title: string; // first user message, truncated
  preview: string; // last message, truncated
  lastActiveAt: Date;
  startedAt: Date;
  messageCount: number;
  isCrisis?: boolean;
}

export interface Helpline {
  name: string;
  number: string;
  available: string;
}
