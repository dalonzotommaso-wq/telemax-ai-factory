/**
 * Core value types for the knowledge engine.
 *
 * These are pure data types (no behavior). Behavioral contracts live in
 * {@link file://./interfaces.ts | interfaces.ts}.
 */
import type { Branded } from "@telemax/core";

/** Nominal identifier for a knowledge document. */
export type DocumentId = Branded<string, "DocumentId">;

/** Content formats the engine understands. `pdf`/`image` are prepared only. */
export type ContentFormat = "markdown" | "json" | "yaml" | "pdf" | "image";

/** Formats that carry textual content and are fully supported today. */
export const TEXT_FORMATS: readonly ContentFormat[] = ["markdown", "json", "yaml"];

/** Formats that are prepared (registered) but not yet extracted. */
export const BINARY_FORMATS: readonly ContentFormat[] = ["pdf", "image"];

/** A recursively-typed, JSON-compatible value (result of parsing JSON/YAML). */
export type StructuredValue =
  | null
  | boolean
  | number
  | string
  | readonly StructuredValue[]
  | StructuredObject;

/** A JSON-like object of structured values. */
export interface StructuredObject {
  readonly [key: string]: StructuredValue;
}

/** A raw item provided by a {@link file://./interfaces.ts | KnowledgeSource}. */
export interface RawDocument {
  /** Stable reference within the source (path, key, URL, …). */
  readonly ref: string;
  /** Declared content format. */
  readonly format: ContentFormat;
  /** Textual content (may be empty for binary/prepared formats). */
  readonly content: string;
  /** Optional binary payload for prepared formats (pdf/image). */
  readonly data?: Uint8Array;
}

/** Filter used when listing documents in a repository. */
export interface DocumentFilter {
  readonly categories?: readonly string[];
  readonly tags?: readonly string[];
  readonly format?: ContentFormat;
}

/** A full-text/embedding search query. */
export interface SearchQuery {
  readonly text: string;
  readonly limit?: number;
  readonly categories?: readonly string[];
  readonly tags?: readonly string[];
}

/** A single search result. */
export interface SearchHit {
  readonly documentId: DocumentId;
  readonly score: number;
}

/** Brand a raw string as a {@link DocumentId}. */
export function asDocumentId(value: string): DocumentId {
  return value as DocumentId;
}
