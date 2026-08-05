/**
 * Generator pipeline step tree (data). Each step coordinates an engine or emits
 * an artifact. The engine stays target-agnostic — steps reference templates,
 * transforms, workflows, prompts or AI by id only.
 */
import type { StructuredObject } from "@telemax/knowledge";

/** Fields shared by every step. */
export interface BaseGeneratorStep {
  readonly id: string;
  readonly name?: string;
}

/** Renders a {@link GeneratorTemplate} into an artifact at `path`. */
export interface TemplateStep extends BaseGeneratorStep {
  readonly kind: "template";
  readonly templateId: string;
  readonly path: string;
  readonly contentType?: string;
}

/** Emits an artifact from a literal or a variable. */
export interface EmitStep extends BaseGeneratorStep {
  readonly kind: "emit";
  readonly path: string;
  readonly content?: string;
  readonly fromVariable?: string;
  readonly contentType?: string;
}

/** Runs a registered transform and stores its result in a variable. */
export interface TransformStep extends BaseGeneratorStep {
  readonly kind: "transform";
  readonly transform: string;
  readonly input?: StructuredObject;
  readonly output: string;
}

/** Coordinates the Workflow Engine and stores its outputs in a variable. */
export interface WorkflowStep extends BaseGeneratorStep {
  readonly kind: "workflow";
  readonly workflowId: string;
  readonly input?: StructuredObject;
  readonly output: string;
}

/** Coordinates the Prompt Engine and stores the rendered content in a variable. */
export interface PromptStep extends BaseGeneratorStep {
  readonly kind: "prompt";
  readonly templateId: string;
  readonly variables?: StructuredObject;
  readonly output: string;
}

/** Coordinates the AI Orchestrator and stores the response in a variable. */
export interface AIStep extends BaseGeneratorStep {
  readonly kind: "ai";
  readonly input?: string;
  readonly templateId?: string;
  readonly variables?: StructuredObject;
  readonly output: string;
}

/** Any generator pipeline step. */
export type GeneratorStep =
  | TemplateStep
  | EmitStep
  | TransformStep
  | WorkflowStep
  | PromptStep
  | AIStep;
