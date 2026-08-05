/**
 * Requests. {@link AIRequest} is the user-facing input to the orchestrator;
 * {@link PreparedRequest} is the normalized, provider-ready request produced by
 * the pipeline.
 */
import type { StructuredObject } from "@telemax/knowledge";
import type { Message } from "./message.js";
import type { ModelId, ProviderId } from "../types.js";

/** Generation parameters (provider-neutral). */
export interface GenerationParams {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly topP?: number;
  readonly stop?: readonly string[];
}

/** A request submitted to the orchestrator. */
export interface AIRequest {
  readonly requestId?: string;
  readonly conversationId?: string;
  readonly input: string | readonly Message[];
  readonly templateId?: string;
  readonly variables?: StructuredObject;
  readonly knowledgeQuery?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly params?: GenerationParams;
  readonly stream?: boolean;
}

/** A normalized request handed to a provider (no secrets, no endpoints). */
export interface PreparedRequest {
  readonly requestId: string;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly messages: readonly Message[];
  readonly params: GenerationParams;
  readonly signature: string;
}
