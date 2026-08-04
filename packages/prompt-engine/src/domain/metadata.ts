/**
 * Prompt metadata (immutable record + builder). Categories/tags are normalized
 * into slugs via the shared `@telemax/knowledge` helper.
 */
import { normalizeLabels } from "@telemax/knowledge";
import type { StructuredObject } from "@telemax/knowledge";

/** Immutable metadata attached to templates and compositions. */
export interface PromptMetadata {
  readonly title?: string;
  readonly description?: string;
  readonly author?: string;
  readonly language: string;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly custom: StructuredObject;
}

/** Partial metadata supplied by callers. */
export interface PromptMetadataInput {
  readonly title?: string;
  readonly description?: string;
  readonly author?: string;
  readonly language?: string;
  readonly categories?: readonly string[];
  readonly tags?: readonly string[];
  readonly custom?: StructuredObject;
}

/** Build normalized {@link PromptMetadata} from an input plus context. */
export function createPromptMetadata(
  input: PromptMetadataInput,
  now: string,
  defaultLanguage: string,
): PromptMetadata {
  const base: PromptMetadata = {
    language: input.language ?? defaultLanguage,
    categories: normalizeLabels(input.categories),
    tags: normalizeLabels(input.tags),
    createdAt: now,
    updatedAt: now,
    custom: input.custom ?? {},
  };
  return {
    ...base,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.author !== undefined ? { author: input.author } : {}),
  };
}
