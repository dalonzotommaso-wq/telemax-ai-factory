/**
 * Behavioral contracts (ports) for the Prompt Engine.
 *
 * Following Dependency Inversion, the service depends only on these
 * abstractions; concrete adapters (renderer, schema validator, cache, metrics,
 * repository, extensions, formatter) implement them, and future capabilities
 * (chains, RAG) plug in through the prepared ports.
 */
import type { Result } from "@telemax/core";
import type { StructuredValue, StructuredObject } from "@telemax/knowledge";
import type { RenderedPrompt } from "./domain/message.js";
import type { PromptTemplate } from "./domain/template.js";
import type { PromptVersion } from "./domain/version.js";
import type { VariableSchema, VariableValues } from "./domain/variable.js";
import type { PromptChainDefinition } from "./domain/advanced.js";
import type { PromptError } from "./errors.js";
import type { TemplateFilter, PromptFormat, TemplateId } from "./types.js";

/** Context passed to a {@link TemplateRenderer}. */
export interface RenderContext {
  readonly variables: VariableValues;
  readonly partials: Readonly<Record<string, string>>;
  readonly strict: boolean;
}

/** Renders a template source string with a context into final text. */
export interface TemplateRenderer {
  render(source: string, context: RenderContext): Result<string, PromptError>;
}

/** Validates variable values against a {@link VariableSchema}, filling defaults. */
export interface SchemaValidator {
  validate(schema: VariableSchema, values: VariableValues): Result<VariableValues, PromptError>;
}

/** Validates a value against a JSON Schema (prepared; structured output). */
export interface JsonSchemaValidator {
  validate(schema: StructuredObject, value: StructuredValue): Result<StructuredValue, PromptError>;
}

/** A synchronous render cache keyed by an opaque cache key. */
export interface RenderCache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  clear(): void;
}

/** A metrics sink for counters and observations (timings, sizes). */
export interface MetricsSink {
  increment(name: string, value?: number): void;
  observe(name: string, value: number): void;
}

/** Persists templates and their version history. */
export interface TemplateRepository {
  save(template: PromptTemplate): Promise<Result<PromptTemplate, PromptError>>;
  get(id: TemplateId): Promise<Result<PromptTemplate, PromptError>>;
  has(id: TemplateId): Promise<boolean>;
  remove(id: TemplateId): Promise<Result<void, PromptError>>;
  list(filter?: TemplateFilter): Promise<Result<readonly PromptTemplate[], PromptError>>;
  versions(id: TemplateId): Promise<Result<readonly PromptVersion[], PromptError>>;
}

/** An extension contributing reusable named partials. */
export interface PromptExtension {
  readonly id: string;
  partials(): Readonly<Record<string, string>>;
}

/** Resolves a requested locale against the available ones, with fallback. */
export interface LocaleResolver {
  resolve(available: readonly string[], requested: string, fallback: string): string;
}

/** Formats a rendered prompt into a target output format. */
export interface PromptFormatter {
  format(rendered: RenderedPrompt, format: PromptFormat): Result<string, PromptError>;
}

/** Executes a prompt chain (prepared; requires a future implementation). */
export interface PromptChainRunner {
  run(
    chain: PromptChainDefinition,
    values: VariableValues,
  ): Promise<Result<RenderedPrompt, PromptError>>;
}

/** Augments variables with retrieved context for RAG (prepared). */
export interface RagAugmentor {
  augment(query: string, values: VariableValues): Promise<Result<VariableValues, PromptError>>;
}
