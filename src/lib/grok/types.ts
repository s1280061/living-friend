export type GrokRole = "system" | "user" | "assistant";

export interface GrokMessage {
  role: GrokRole;
  content: string;
}

export interface GrokChatOptions {
  messages: GrokMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Ask Grok to return strict JSON (used by cron generators). */
  json?: boolean;
}

export interface GrokChatResult {
  content: string;
  raw: unknown;
}
