/**
 * Public API of `@telemax/generator-engine` — the generic Generator Engine.
 *
 * Register generators, run generation pipelines and produce artifacts, while
 * coordinating the Workflow Engine, AI Orchestrator, Prompt Engine and Knowledge
 * Engine. Completely target-agnostic (no WordPress/React/Flutter/Laravel
 * knowledge). Supports templates, variables, validation, logging, metrics,
 * events, versioning, serialization, cache and import/export. Foreseen targets
 * (WordPress, React, Next.js, Laravel, Flutter, Desktop, API, SaaS, CRM, ERP) are
 * prepared as conventions only. Infrastructure only — no specific generators.
 */

// Types
export { GENERATOR_TARGETS, asGeneratorId } from "./types.js";
export type {
  GeneratorId,
  GeneratorState,
  StepKind,
  ArtifactEncoding,
  TargetKind,
} from "./types.js";

// Errors
export {
  GeneratorValidationError,
  GeneratorNotFoundError,
  GeneratorDuplicateError,
  GeneratorStepError,
  TemplateNotFoundError,
  TransformNotFoundError,
  GeneratorCompilationError,
  GeneratorNotImplementedError,
  GeneratorIoError,
} from "./errors.js";
export type { GeneratorError } from "./errors.js";

// Config
export { DEFAULT_GENERATOR_CONFIG, resolveGeneratorConfig } from "./config.js";
export type {
  GeneratorEngineConfig,
  GeneratorEngineConfigInput,
  GeneratorConfiguration,
  GeneratorCacheConfig,
} from "./config.js";

// Utils
export {
  canonicalize,
  hashValue,
  interpolate,
  checksum,
  slugify,
  normalizeLabels,
  systemClock,
  uuidIdGenerator,
} from "./utils.js";
export type { Clock, IdGenerator } from "./utils.js";

// Events
export { GeneratorEventBus } from "./events.js";
export type { GeneratorEvents, EventBus, EventHandler } from "./events.js";

// Interfaces (ports)
export type {
  TemplateRenderer,
  GeneratorTransform,
  ArtifactWriter,
  MetricsSink,
  GeneratorResultCache,
  WorkflowRunner,
  AIRunner,
  PromptRunner,
  KnowledgeRunner,
} from "./interfaces.js";

// Domain
export { createGeneratorMetadata } from "./domain/metadata.js";
export type { GeneratorMetadata, GeneratorMetadataInput } from "./domain/metadata.js";
export type { GeneratorVersion } from "./domain/version.js";
export type { GeneratorTemplate } from "./domain/template.js";
export { ArtifactCollection } from "./domain/artifact.js";
export type { GeneratorArtifact, GeneratorOutput } from "./domain/artifact.js";
export type {
  BaseGeneratorStep,
  TemplateStep,
  EmitStep,
  TransformStep,
  WorkflowStep,
  PromptStep,
  AIStep,
  GeneratorStep,
} from "./domain/step.js";
export type { GeneratorPipeline } from "./domain/pipeline.js";
export { Generator } from "./domain/definition.js";
export type { GeneratorDefinition, GeneratorProps } from "./domain/definition.js";
export { createContext, withVariable } from "./domain/context.js";
export type { GeneratorContext } from "./domain/context.js";
export type { GeneratorResult } from "./domain/result.js";

// Template / artifact / transforms
export { GeneratorTemplateRepository } from "./template/repository.js";
export { DefaultTemplateRenderer } from "./template/renderer.js";
export { InMemoryArtifactWriter } from "./artifact/writer.js";
export { FileSystemArtifactWriter } from "./artifact/fs-writer.js";
export { GeneratorTransformRegistry } from "./transforms/registry.js";
export {
  identityTransform,
  jsonTransform,
  registerBuiltinTransforms,
} from "./transforms/builtin.js";

// Runners (coordination adapters)
export { workflowRunner, aiRunner, promptRunner, knowledgeRunner } from "./runners/adapters.js";

// Execution
export { GeneratorExecution } from "./execution/execution.js";
export type { GeneratorExecutionDeps } from "./execution/execution.js";

// Factory / validator / registry / cache / metrics
export { GeneratorFactory } from "./factory.js";
export { GeneratorValidator } from "./validator.js";
export { GeneratorRegistry } from "./registry.js";
export { InMemoryResultCache } from "./cache.js";
export { NoopMetricsSink, MetricsCollector } from "./metrics.js";

// Import / export
export { ExportManager } from "./export-manager.js";
export type { GeneratorBundle } from "./export-manager.js";
export { ImportManager } from "./import-manager.js";

// Engine
export { GeneratorEngine } from "./engine.js";
export type { GeneratorEngineDeps } from "./engine.js";

// Dependency injection
export {
  registerGeneratorEngine,
  GENERATOR_CONFIG,
  GENERATOR_EVENTS,
  GENERATOR_TEMPLATES,
  GENERATOR_TRANSFORMS,
  GENERATOR_ENGINE,
} from "./di.js";
