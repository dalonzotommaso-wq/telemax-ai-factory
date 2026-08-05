/**
 * Rendered conversation messages produced by composition rendering.
 */
import type { PromptRole } from "../types.js";

/** A single rendered message (role + resolved content). */
export interface RenderedMessage {
  readonly role: PromptRole;
  readonly content: string;
}

/** A fully rendered, multi-role prompt. */
export interface RenderedPrompt {
  readonly messages: readonly RenderedMessage[];
}
