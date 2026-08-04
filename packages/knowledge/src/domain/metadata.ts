/**
 * Document metadata.
 *
 * {@link DocumentMetadata} is an immutable record; {@link createMetadata}
 * builds it from a partial input, normalizing categories/tags into slugs and
 * applying defaults. Optional fields are omitted (never set to `undefined`) to
 * satisfy the strict `exactOptionalPropertyTypes` compiler option.
 */
import { normalizeLabels } from "../utils.js";
import type { StructuredObject } from "../types.js";

/** Immutable metadata attached to every document. */
export interface DocumentMetadata {
  readonly title?: string;
  readonly description?: string;
  readonly author?: string;
  readonly language: string;
  readonly source?: string;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly custom: StructuredObject;
}

/** Partial metadata supplied by callers/loaders. */
export interface MetadataInput {
  readonly title?: string;
  readonly description?: string;
  readonly author?: string;
  readonly language?: string;
  readonly source?: string;
  readonly categories?: readonly string[];
  readonly tags?: readonly string[];
  readonly custom?: StructuredObject;
}

/** Build normalized {@link DocumentMetadata} from an input plus context. */
export function createMetadata(
  input: MetadataInput,
  now: string,
  defaultLanguage: string,
): DocumentMetadata {
  const base: DocumentMetadata = {
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
    ...(input.source !== undefined ? { source: input.source } : {}),
  };
}

/** Return a copy of `metadata` with `updatedAt` refreshed. */
export function touchMetadata(metadata: DocumentMetadata, now: string): DocumentMetadata {
  return { ...metadata, updatedAt: now };
}
