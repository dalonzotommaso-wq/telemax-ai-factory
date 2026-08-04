/**
 * Centralized configuration for the knowledge engine.
 *
 * Configuration is a plain, typed object with safe defaults. Consumers may
 * supply a partial input; {@link resolveConfig} merges it over the defaults.
 */

/** Indexing feature switches. */
export interface IndexingConfig {
  /** Enable the in-memory full-text index. */
  readonly fullText: boolean;
  /** Enable embedding indexing (requires an EmbeddingProvider; prepared). */
  readonly embeddings: boolean;
}

/** The resolved knowledge configuration. */
export interface KnowledgeConfig {
  /** Default language applied to documents without one. */
  readonly defaultLanguage: string;
  /** Whether every save snapshots a new version. */
  readonly enableVersioning: boolean;
  /** Maximum document content size, in bytes. */
  readonly maxContentBytes: number;
  /** Indexing switches. */
  readonly indexing: IndexingConfig;
}

/** Partial configuration input accepted by {@link resolveConfig}. */
export interface KnowledgeConfigInput {
  readonly defaultLanguage?: string;
  readonly enableVersioning?: boolean;
  readonly maxContentBytes?: number;
  readonly indexing?: Partial<IndexingConfig>;
}

/** Safe, zero-configuration defaults. */
export const DEFAULT_KNOWLEDGE_CONFIG: KnowledgeConfig = {
  defaultLanguage: "en",
  enableVersioning: true,
  maxContentBytes: 5 * 1024 * 1024,
  indexing: { fullText: true, embeddings: false },
};

/** Merge a partial input over {@link DEFAULT_KNOWLEDGE_CONFIG}. */
export function resolveConfig(input?: KnowledgeConfigInput): KnowledgeConfig {
  return {
    defaultLanguage: input?.defaultLanguage ?? DEFAULT_KNOWLEDGE_CONFIG.defaultLanguage,
    enableVersioning: input?.enableVersioning ?? DEFAULT_KNOWLEDGE_CONFIG.enableVersioning,
    maxContentBytes: input?.maxContentBytes ?? DEFAULT_KNOWLEDGE_CONFIG.maxContentBytes,
    indexing: {
      fullText: input?.indexing?.fullText ?? DEFAULT_KNOWLEDGE_CONFIG.indexing.fullText,
      embeddings: input?.indexing?.embeddings ?? DEFAULT_KNOWLEDGE_CONFIG.indexing.embeddings,
    },
  };
}
