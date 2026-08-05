/** Generator metadata (immutable record + builder). */
import { normalizeLabels } from "@telemax/knowledge";
import type { StructuredObject } from "@telemax/knowledge";

export interface GeneratorMetadata {
  readonly title?: string;
  readonly description?: string;
  readonly author?: string;
  readonly target?: string;
  readonly language: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly custom: StructuredObject;
}

export interface GeneratorMetadataInput {
  readonly title?: string;
  readonly description?: string;
  readonly author?: string;
  readonly target?: string;
  readonly language?: string;
  readonly tags?: readonly string[];
  readonly custom?: StructuredObject;
}

/** Build normalized {@link GeneratorMetadata}. */
export function createGeneratorMetadata(
  input: GeneratorMetadataInput,
  now: string,
  defaultLanguage: string,
): GeneratorMetadata {
  return {
    language: input.language ?? defaultLanguage,
    tags: normalizeLabels(input.tags),
    createdAt: now,
    updatedAt: now,
    custom: input.custom ?? {},
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.author !== undefined ? { author: input.author } : {}),
    ...(input.target !== undefined ? { target: input.target } : {}),
  };
}
