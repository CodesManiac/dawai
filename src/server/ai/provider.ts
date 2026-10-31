/**
 * AI provider boundary.
 *
 * Task 001 defines the contract only. A future adapter will wrap the Vercel AI
 * SDK here; features must depend on this interface rather than a vendor SDK.
 * Never import this module from client components.
 */
export type AiRole = "system" | "user" | "assistant";

export interface AiMessage {
  role: AiRole;
  content: string;
}

export interface AiTextRequest {
  messages: readonly AiMessage[];
  temperature?: number;
  signal?: AbortSignal;
}

export interface AiTextResult {
  text: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AiProvider {
  /** Stable identifier used in logs and evaluation metadata. */
  readonly id: string;
  generateText(request: AiTextRequest): Promise<AiTextResult>;
}
