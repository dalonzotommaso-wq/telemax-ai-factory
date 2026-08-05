/**
 * Prompt composition — assembling multiple role-tagged template references into
 * a single multi-level prompt. Rendering resolves each part and yields a
 * {@link RenderedPrompt}.
 */
import type { CompositionId, PromptRole, TemplateId } from "../types.js";
import type { PromptMetadata } from "./metadata.js";
import type { VariableValues } from "./variable.js";

/** One part of a composed prompt: a role plus a template reference. */
export interface PromptPart {
  readonly role: PromptRole;
  readonly templateId: TemplateId;
  /** Part-specific variable overrides merged over the render call variables. */
  readonly variables?: VariableValues;
}

/** A composed, multi-level prompt definition. */
export interface PromptComposition {
  readonly id: CompositionId;
  readonly name: string;
  readonly parts: readonly PromptPart[];
  readonly metadata: PromptMetadata;
}
