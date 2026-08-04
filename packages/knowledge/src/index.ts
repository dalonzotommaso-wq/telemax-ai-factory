/**
 * Public API of `@telemax/knowledge`.
 *
 * The Knowledge Base engine: documents, metadata, versioning, categories, tags,
 * loaders (markdown/json/yaml; pdf/image prepared), an extensible repository and
 * index (full-text; embeddings prepared), plus import/export and DI wiring.
 * Depends only on `@telemax/core`.
 */

// Types
export { TEXT_FORMATS, BINARY_FORMATS, asDocumentId } from "./types.js";
export type {
  DocumentId,
  ContentFormat,
  StructuredObject,
  StructuredValue,
  RawDocument,
  DocumentFilter,
  SearchQuery,
  SearchHit,
} from "./types.js";

// Errors
export {
  KnowledgeValidationError,
  KnowledgeNotFoundError,
  KnowledgeDuplicateError,
  UnsupportedFormatError,
  KnowledgeParseError,
  NotImplementedError,
  KnowledgeIoError,
} from "./errors.js";
export type { KnowledgeError } from "./errors.js";

// Config
export { DEFAULT_KNOWLEDGE_CONFIG, resolveConfig } from "./config.js";
export type { KnowledgeConfig, KnowledgeConfigInput, IndexingConfig } from "./config.js";

// Utils
export {
  systemClock,
  uuidIdGenerator,
  checksum,
  slugify,
  tokenize,
  normalizeLabels,
} from "./utils.js";
export type { Clock, IdGenerator } from "./utils.js";

// Events
export { KnowledgeEventBus } from "./events.js";
export type { EventBus, EventHandler, KnowledgeEvents } from "./events.js";

// Interfaces (ports)
export type {
  StructuredTextParser,
  KnowledgeLoader,
  KnowledgeSource,
  KnowledgeRepository,
  KnowledgeIndex,
  EmbeddingProvider,
} from "./interfaces.js";

// Domain
export { Document } from "./domain/document.js";
export type { DocumentProps, DocumentInput } from "./domain/document.js";
export { createMetadata, touchMetadata } from "./domain/metadata.js";
export type { DocumentMetadata, MetadataInput } from "./domain/metadata.js";
export { versionOf } from "./domain/version.js";
export type { KnowledgeVersion } from "./domain/version.js";
export { KnowledgeCategory } from "./domain/category.js";
export { KnowledgeTag } from "./domain/tag.js";

// Loaders
export {
  asStructured,
  JsonStructuredParser,
  YamlStructuredParser,
  parseFrontMatter,
  metadataFromStructured,
} from "./loaders/parsers.js";
export { KnowledgeLoaderBase } from "./loaders/loader.js";
export type { ExtractResult, LoaderDeps } from "./loaders/loader.js";
export { MarkdownLoader } from "./loaders/markdown-loader.js";
export { JsonLoader } from "./loaders/json-loader.js";
export { YamlLoader } from "./loaders/yaml-loader.js";
export { PdfLoader, ImageLoader } from "./loaders/binary-loaders.js";

// Repository
export { InMemoryKnowledgeRepository } from "./repository/in-memory-repository.js";
export type { RepositoryOptions } from "./repository/in-memory-repository.js";

// Indexing
export { InMemoryFullTextIndex } from "./indexing/in-memory-fulltext-index.js";
export { EmbeddingKnowledgeIndex } from "./indexing/embedding-index.js";

// Validation
export { KnowledgeValidator, defaultRules } from "./validator.js";
export type { ValidationRule, ValidatorOptions } from "./validator.js";

// Registry & sources
export { KnowledgeRegistry } from "./registry.js";
export { InMemoryKnowledgeSource } from "./source.js";

// Service
export { KnowledgeService } from "./service.js";
export type { KnowledgeServiceDeps, AddDocumentInput } from "./service.js";

// Import / export
export { ExportManager } from "./export-manager.js";
export type { KnowledgeBundle, SerializedDocument } from "./export-manager.js";
export { ImportManager } from "./import-manager.js";

// Dependency injection
export {
  registerKnowledge,
  KNOWLEDGE_CONFIG,
  KNOWLEDGE_EVENTS,
  KNOWLEDGE_REGISTRY,
  KNOWLEDGE_REPOSITORY,
  KNOWLEDGE_VALIDATOR,
  KNOWLEDGE_INDEX,
  KNOWLEDGE_SERVICE,
} from "./di.js";
