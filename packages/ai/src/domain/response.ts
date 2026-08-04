/** Standardized responses returned by the orchestrator. */
import type { FinishReason, ModelId, ProviderId } from "../types.js";

/** Token accounting for a generation. */
export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

/** A standardized, provider-neutral response. */
export interface AIResponse {
  readonly requestId: string;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly content: string;
  readonly finishReason: FinishReason;
  readonly usage: TokenUsage;
  readonly cost: number;
  readonly createdAt: string;
}

/** A streaming delta (prepared; the default provider emits a single chunk). */
export interface AIResponseChunk {
  readonly requestId: string;
  readonly delta: string;
  readonly done: boolean;
}
