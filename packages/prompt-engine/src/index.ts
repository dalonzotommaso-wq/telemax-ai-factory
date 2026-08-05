/**
 * Public API of `@telemax/prompt-engine`.
 *
 * Enterprise Prompt Engine: templates, variables, validation, versioning,
 * rendering, composition, multi-role prompts, inheritance, extensions, i18n,
 * cache, metrics, events, import/export — provider-agnostic. Advanced
 * capabilities (chains, RAG, tool/function/MCP, structured output) are prepared.
 * Depends only on `@telemax/core` and `@telemax/knowledge`.
 */

// Types
export {
  PROMPT_ROLES,
  SUPPORTED_FORMATS,
  PREPARED_FORMATS,
  asTemplateId,
  asCompositionId,
} from "./types.js";
export type {
  TemplateId,
  CompositionId,
  PromptRole,
  PromptFormat,
  VariableType,
  TemplateFilter,
} from "./types.js";

// Errors
export {
  PromptValidationError,
  PromptNotFoundError,
  PromptDuplicateError,
  PromptRenderError,
  PromptResolutionError,
  PromptNotImplementedError,
  PromptIoError,
} from "./errors.js";
export type { PromptError } from "./errors.js";

// Config
export { DEFAULT_PROMPT_CONFIG, resolvePromptConfig } from "./config.js";
export type { PromptEngineConfig, PromptEngineConfigInput, PromptCacheConfig } from "./config.js";

// Utils
export {
  canonicalize,
  hashValue,
  checksum,
  slugify,
  tokenize,
  normalizeLabels,
  systemClock,
  uuidIdGenerator,
} from "./utils.js";
export type { Clock, IdGenerator } from "./utils.js";

// Events
export { PromptEventBus } from "./events.js";
export type { EventBus, EventHandler, PromptEvents } from "./events.js";

// Interfaces (ports)
export type {
  RenderContext,
  TemplateRenderer,
  SchemaValidator,
  JsonSchemaValidator,
  RenderCache,
  MetricsSink,
  TemplateRepository,
  PromptExtension,
  LocaleResolver,
  PromptFormatter,
  PromptChainRunner,
  RagAugmentor,
} from "./interfaces.js";

// Domain
export { createPromptMetadata } from "./domain/metadata.js";
export type { PromptMetadata, PromptMetadataInput } from "./domain/metadata.js";
export type { VariableDefinition, VariableSchema, VariableValues } from "./domain/variable.js";
export type { RenderedMessage, RenderedPrompt } from "./domain/message.js";
export { PromptTemplate, computeSignature } from "./domain/template.js";
export type { PromptTemplateProps, PromptTemplateInput } from "./domain/template.js";
export { versionOf } from "./domain/version.js";
export type { PromptVersion } from "./domain/version.js";
export type { PromptComposition, PromptPart } from "./domain/composition.js";
export type {
  ChainStep,
  PromptChainDefinition,
  FunctionParameter,
  FunctionDefinition,
  ToolDefinition,
  StructuredOutputSpec,
} from "./domain/advanced.js";

// Rendering
export { DefaultTemplateRenderer } from "./rendering/default-renderer.js";
export { DefaultPromptFormatter } from "./rendering/formatters.js";
export { DefaultLocaleResolver } from "./rendering/locale.js";
export { resolveInheritance } from "./rendering/inheritance.js";

// Schema / cache / metrics
export { DefaultSchemaValidator } from "./schema/schema-validator.js";
export { InMemoryRenderCache } from "./cache/in-memory-cache.js";
export { NoopMetricsSink, InMemoryMetricsSink } from "./metrics/metrics.js";

// Repository / registry / validator
export { InMemoryTemplateRepository } from "./repository/in-memory-template-repository.js";
export type { TemplateRepositoryOptions } from "./repository/in-memory-template-repository.js";
export { PromptRegistry } from "./registry.js";
export { PromptValidator, defaultTemplateRules } from "./validator.js";
export type { PromptValidationRule } from "./validator.js";

// Import / export
export { ExportManager } from "./export-manager.js";
export type { PromptBundle, SerializedTemplate } from "./export-manager.js";
export { ImportManager } from "./import-manager.js";

// Prepared adapters
export {
  NotImplementedChainRunner,
  NotImplementedRagAugmentor,
  NotImplementedJsonSchemaValidator,
} from "./predisposition.js";

// Service
export { PromptEngine } from "./service.js";
export type {
  PromptEngineDeps,
  RegisterTemplateInput,
  RenderInput,
  RenderResult,
  CompositionRenderResult,
} from "./service.js";

// Dependency injection
export {
  registerPromptEngine,
  PROMPT_CONFIG,
  PROMPT_EVENTS,
  PROMPT_REPOSITORY,
  PROMPT_REGISTRY,
  PROMPT_VALIDATOR,
  PROMPT_RENDERER,
  PROMPT_SCHEMA_VALIDATOR,
  PROMPT_FORMATTER,
  PROMPT_CACHE,
  PROMPT_ENGINE,
} from "./di.js";
