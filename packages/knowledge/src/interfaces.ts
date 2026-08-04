/**
 * Behavioral contracts (ports) for the knowledge engine.
 *
 * Following the Dependency-Inversion Principle, high-level modules (the
 * service) depend on these abstractions, and concrete adapters (loaders,
 * repositories, indexes, embedding providers) implement them. This is what
 * keeps the engine modular and lets future providers plug in.
 */
import type { Result } from "@telemax/core";
import type { Document } from "./domain/document.js";
import type { KnowledgeVersion } from "./domain/version.js";
import type { KnowledgeError } from "./errors.js";
import type {
  ContentFormat,
  DocumentFilter,
  DocumentId,
  RawDocument,
  SearchHit,
  SearchQuery,
  StructuredValue,
} from "./types.js";

/** Parses textual content into a structured value (JSON, YAML, …). */
export interface StructuredTextParser {
  parse(text: string): Result<StructuredValue, KnowledgeError>;
}

/** Turns a {@link RawDocument} into a validated {@link Document}. */
export interface KnowledgeLoader {
  /** Formats this loader handles. */
  readonly formats: readonly ContentFormat[];
  /** Whether this loader supports the given format. */
  supports(format: ContentFormat): boolean;
  /** Load and normalize a raw document. */
  load(raw: RawDocument): Promise<Result<Document, KnowledgeError>>;
}

/** A provider of raw documents (filesystem, memory, remote, …). */
export interface KnowledgeSource {
  /** Stable source identifier. */
  readonly id: string;
  /** Enumerate the raw documents available in this source. */
  list(): Promise<Result<readonly RawDocument[], KnowledgeError>>;
}

/** Persists documents and their version history. */
export interface KnowledgeRepository {
  save(document: Document): Promise<Result<Document, KnowledgeError>>;
  get(id: DocumentId): Promise<Result<Document, KnowledgeError>>;
  has(id: DocumentId): Promise<boolean>;
  remove(id: DocumentId): Promise<Result<void, KnowledgeError>>;
  list(filter?: DocumentFilter): Promise<Result<readonly Document[], KnowledgeError>>;
  versions(id: DocumentId): Promise<Result<readonly KnowledgeVersion[], KnowledgeError>>;
}

/** A searchable index over documents (full-text or embedding-based). */
export interface KnowledgeIndex {
  add(document: Document): Promise<Result<void, KnowledgeError>>;
  remove(id: DocumentId): Promise<Result<void, KnowledgeError>>;
  search(query: SearchQuery): Promise<Result<readonly SearchHit[], KnowledgeError>>;
  clear(): Promise<void>;
}

/** Produces embedding vectors for text (prepared; no default implementation). */
export interface EmbeddingProvider {
  readonly id: string;
  embed(text: string): Promise<Result<readonly number[], KnowledgeError>>;
}
