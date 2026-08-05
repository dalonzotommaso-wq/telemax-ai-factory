/**
 * Core value types for the Prompt Engine.
 *
 * Pure data only; behavioral contracts live in {@link file://./interfaces.ts}.
 * Structured values are reused from `@telemax/knowledge` to avoid duplication.
 */
import type { Branded } from "@telemax/core";

/** Nominal identifier for a prompt template. */
export type TemplateId = Branded<string, "TemplateId">;

/** Nominal identifier for a composed prompt. */
export type CompositionId = Branded<string, "CompositionId">;

/** Conversation roles supported by composed prompts. */
export type PromptRole = "system" | "developer" | "user" | "assistant";

/** All roles, in canonical order. */
export const PROMPT_ROLES: readonly PromptRole[] = ["system", "developer", "user", "assistant"];

/** Output/serialization formats. `xml`/`json` are prepared (structured output). */
export type PromptFormat = "text" | "markdown" | "xml" | "json";

/** Formats rendered today. */
export const SUPPORTED_FORMATS: readonly PromptFormat[] = ["text", "markdown"];

/** Formats prepared for future structured output. */
export const PREPARED_FORMATS: readonly PromptFormat[] = ["xml", "json"];

/** Declared variable types for template variables. */
export type VariableType = "string" | "number" | "boolean" | "list" | "object" | "enum";

/** Brand a raw string as a {@link TemplateId}. */
export function asTemplateId(value: string): TemplateId {
  return value as TemplateId;
}

/** Filter used when listing templates in a repository. */
export interface TemplateFilter {
  readonly categories?: readonly string[];
  readonly tags?: readonly string[];
  readonly format?: PromptFormat;
  readonly role?: PromptRole;
}

/** Brand a raw string as a {@link CompositionId}. */
export function asCompositionId(value: string): CompositionId {
  return value as CompositionId;
}
