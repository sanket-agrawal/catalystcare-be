export type SupportedChannel = "whatsapp" | "chrome_extension" | "web";

export interface VentTextRequestDto {
  message: string;
  userId?: string;
  channel?: SupportedChannel;
}

export interface VentVoiceRequestDto {
  transcript?: string;
  audioUrl?: string;
  userId?: string;
  channel?: SupportedChannel;
}

export type ToolName = "meditate" | "joke" | "pomodoro" | "vent";

export interface ToolRequestDto {
  tool: ToolName;
  input?: string;
  userId?: string;
  channel?: SupportedChannel;
}
