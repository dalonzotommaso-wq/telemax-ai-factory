/**
 * Core value types for the AI Orchestrator. Pure data only; behavioral
 * contracts live in {@link file://./interfaces.ts}. Conversation roles are
 * reused from `@telemax/prompt-engine` to stay consistent across the platform.
 */
import type { Branded } from "@telemax/core";
import type { PromptRole } from "@telemax/prompt-engine";

/** Nominal identifier for a provider. */
export type ProviderId = Branded<string, "ProviderId">;

/** Nominal identifier for a model. */
export type ModelId = Branded<string, "ModelId">;

/** Message role — same taxonomy as the Prompt Engine. */
export type MessageRole = PromptRole;

/** Why a generation stopped. */
export type FinishReason = "stop" | "length" | "content_filter" | "tool_calls" | "error";

/** Supported content modalities (text implemented; others prepared). */
export type Modality = "text" | "image" | "audio";

/** Provider health states. */
export type HealthState = "healthy" | "degraded" | "unavailable";

/** Circuit-breaker states. */
export type CircuitState = "closed" | "open" | "half-open";

/**
 * Well-known provider keys the orchestrator is designed to host. This list is
 * documentation/registry convention only — the orchestrator is provider-agnostic
 * and never branches on these values.
 */
export const KNOWN_PROVIDERS: readonly string[] = [
  "anthropic",
  "openai",
  "gemini",
  "openrouter",
  "ollama",
  "azure-openai",
  "bedrock",
];

/** Brand a raw string as a {@link ProviderId}. */
export function asProviderId(value: string): ProviderId {
  return value as ProviderId;
}

/** Brand a raw string as a {@link ModelId}. */
export function asModelId(value: string): ModelId {
  return value as ModelId;
}
