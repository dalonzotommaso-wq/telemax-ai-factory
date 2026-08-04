/**
 * Behavioral contracts (ports) for the Generator Engine. The engine and its
 * execution depend only on these abstractions; adapters implement them. The
 * coordination runners bridge to the Workflow, AI, Prompt and Knowledge engines.
 */
import type { Result } from "@telemax/core";
import type { StructuredObject, StructuredValue } from "@telemax/knowledge";
import type { GeneratorArtifact } from "./domain/artifact.js";
import type { GeneratorContext } from "./domain/context.js";
import type { GeneratorResult } from "./domain/result.js";
import type { GeneratorTemplate } from "./domain/template.js";
import type { GeneratorError } from "./errors.js";

/** Renders a {@link GeneratorTemplate} with variables into a string. */
export interface TemplateRenderer {
  render(
    template: GeneratorTemplate,
    variables: Readonly<Record<string, StructuredValue>>,
  ): Result<string, GeneratorError>;
}

/** Transforms an input object into a structured value (registered by id). */
export type GeneratorTransform = (
  input: StructuredObject,
  context: GeneratorContext,
) => Promise<Result<StructuredValue, GeneratorError>>;

/** Persists a produced artifact to a sink. */
export interface ArtifactWriter {
  write(artifact: GeneratorArtifact): Result<void, GeneratorError>;
}

/** A metrics sink for counters and observations. */
export interface MetricsSink {
  increment(name: string, value?: number): void;
  observe(name: string, value: number): void;
}

/** A cache of generation results keyed by a request signature. */
export interface GeneratorResultCache {
  get(key: string): GeneratorResult | undefined;
  set(key: string, value: GeneratorResult): void;
  clear(): void;
}

/** Coordinates the Workflow Engine. */
export interface WorkflowRunner {
  run(
    workflowId: string,
    input: StructuredObject,
  ): Promise<Result<Readonly<Record<string, StructuredValue>>, GeneratorError>>;
}

/** Coordinates the AI Orchestrator. */
export interface AIRunner {
  run(request: {
    readonly input?: string;
    readonly templateId?: string;
    readonly variables?: StructuredObject;
  }): Promise<Result<string, GeneratorError>>;
}

/** Coordinates the Prompt Engine. */
export interface PromptRunner {
  render(templateId: string, variables?: StructuredObject): Promise<Result<string, GeneratorError>>;
}

/** Coordinates Knowledge retrieval. */
export interface KnowledgeRunner {
  retrieve(query: string): Promise<Result<readonly string[], GeneratorError>>;
}
