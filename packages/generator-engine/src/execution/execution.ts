/**
 * {@link GeneratorExecution} — runs a compiled {@link Generator}'s pipeline against
 * a context: renders templates and emits artifacts, runs transforms, and
 * coordinates the Workflow, AI and Prompt engines through injected runners.
 * Emits events and metrics. Target-agnostic: it never inspects the target.
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import { ArtifactCollection, type GeneratorArtifact } from "../domain/artifact.js";
import { createContext, withVariable, type GeneratorContext } from "../domain/context.js";
import type { Generator } from "../domain/definition.js";
import type { GeneratorResult } from "../domain/result.js";
import type {
  AIStep,
  EmitStep,
  GeneratorStep,
  PromptStep,
  TemplateStep,
  TransformStep,
  WorkflowStep,
} from "../domain/step.js";
import {
  GeneratorNotImplementedError,
  GeneratorStepError,
  TransformNotFoundError,
  type GeneratorError,
} from "../errors.js";
import type { EventBus, GeneratorEvents } from "../events.js";
import type {
  AIRunner,
  ArtifactWriter,
  KnowledgeRunner,
  MetricsSink,
  PromptRunner,
  TemplateRenderer,
  WorkflowRunner,
} from "../interfaces.js";
import type { GeneratorTemplateRepository } from "../template/repository.js";
import type { GeneratorTransformRegistry } from "../transforms/registry.js";
import { interpolate, systemClock, type Clock } from "../utils.js";

/** Collaborators for {@link GeneratorExecution}. */
export interface GeneratorExecutionDeps {
  readonly templates: GeneratorTemplateRepository;
  readonly renderer: TemplateRenderer;
  readonly transforms: GeneratorTransformRegistry;
  readonly writer: ArtifactWriter;
  readonly events: EventBus<GeneratorEvents>;
  readonly metrics: MetricsSink;
  readonly clock?: Clock;
  readonly workflow?: WorkflowRunner;
  readonly ai?: AIRunner;
  readonly prompt?: PromptRunner;
  readonly knowledge?: KnowledgeRunner;
}

function stringifyValue(value: StructuredValue | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

export class GeneratorExecution {
  private readonly clock: Clock;

  public constructor(private readonly deps: GeneratorExecutionDeps) {
    this.clock = deps.clock ?? systemClock;
  }

  public async run(
    generator: Generator,
    variables: Readonly<Record<string, StructuredValue>> = {},
    runId = `${generator.id}-${String(this.clock.now().getTime())}`,
  ): Promise<GeneratorResult> {
    const startedAt = this.clock.now().getTime();
    const artifacts = new ArtifactCollection();
    let context = createContext(generator.id, runId, generator.target, {
      ...(generator.configuration.variables ?? {}),
      ...variables,
    });
    this.deps.events.emit("generation.started", { generatorId: generator.id, runId });

    for (const step of generator.pipeline.steps) {
      this.deps.events.emit("step.started", { runId, stepId: step.id, kind: step.kind });
      const outcome = await this.execStep(step, context, artifacts, runId);
      if (isErr(outcome)) {
        this.deps.metrics.increment("generator.step.failed");
        this.deps.events.emit("step.failed", { runId, stepId: step.id, error: outcome.error });
        this.deps.events.emit("generation.failed", {
          generatorId: generator.id,
          runId,
          error: outcome.error,
        });
        return {
          generatorId: generator.id,
          runId,
          state: "failed",
          artifacts,
          variables: context.variables,
          durationMs: this.clock.now().getTime() - startedAt,
          error: outcome.error.message,
        };
      }
      context = outcome.value;
      this.deps.metrics.increment("generator.step.completed");
      this.deps.events.emit("step.completed", { runId, stepId: step.id });
    }

    this.deps.events.emit("generation.completed", {
      generatorId: generator.id,
      runId,
      artifacts: artifacts.size,
    });
    this.deps.metrics.increment("generator.completed");
    return {
      generatorId: generator.id,
      runId,
      state: "completed",
      artifacts,
      variables: context.variables,
      durationMs: this.clock.now().getTime() - startedAt,
    };
  }

  private async execStep(
    step: GeneratorStep,
    context: GeneratorContext,
    artifacts: ArtifactCollection,
    runId: string,
  ): Promise<Result<GeneratorContext, GeneratorError>> {
    switch (step.kind) {
      case "template":
        return this.execTemplate(step, context, artifacts, runId);
      case "emit":
        return this.execEmit(step, context, artifacts, runId);
      case "transform":
        return this.execTransform(step, context);
      case "workflow":
        return this.execWorkflow(step, context);
      case "prompt":
        return this.execPrompt(step, context);
      case "ai":
        return this.execAI(step, context);
      default:
        return err(new GeneratorStepError("Unsupported step kind.", "unknown"));
    }
  }

  private execTemplate(
    step: TemplateStep,
    context: GeneratorContext,
    artifacts: ArtifactCollection,
    runId: string,
  ): Result<GeneratorContext, GeneratorError> {
    const template = this.deps.templates.get(step.templateId);
    if (isErr(template)) {
      return template;
    }
    const rendered = this.deps.renderer.render(template.value, context.variables);
    if (isErr(rendered)) {
      return rendered;
    }
    const artifact: GeneratorArtifact = {
      path: interpolate(step.path, context.variables),
      content: rendered.value,
      contentType: step.contentType ?? template.value.contentType ?? "text/plain",
      encoding: "utf-8",
    };
    return this.emitArtifact(artifact, artifacts, runId, context);
  }

  private execEmit(
    step: EmitStep,
    context: GeneratorContext,
    artifacts: ArtifactCollection,
    runId: string,
  ): Result<GeneratorContext, GeneratorError> {
    const content =
      step.content !== undefined
        ? interpolate(step.content, context.variables)
        : stringifyValue(
            step.fromVariable !== undefined ? context.variables[step.fromVariable] : "",
          );
    const artifact: GeneratorArtifact = {
      path: interpolate(step.path, context.variables),
      content,
      contentType: step.contentType ?? "text/plain",
      encoding: "utf-8",
    };
    return this.emitArtifact(artifact, artifacts, runId, context);
  }

  private emitArtifact(
    artifact: GeneratorArtifact,
    artifacts: ArtifactCollection,
    runId: string,
    context: GeneratorContext,
  ): Result<GeneratorContext, GeneratorError> {
    const written = this.deps.writer.write(artifact);
    if (isErr(written)) {
      return written;
    }
    artifacts.add(artifact);
    this.deps.metrics.increment("generator.artifact");
    this.deps.events.emit("artifact.written", { runId, path: artifact.path });
    return ok(context);
  }

  private async execTransform(
    step: TransformStep,
    context: GeneratorContext,
  ): Promise<Result<GeneratorContext, GeneratorError>> {
    const transform = this.deps.transforms.get(step.transform);
    if (transform === undefined) {
      return err(new TransformNotFoundError(`Transform "${step.transform}" is not registered.`));
    }
    const result = await transform(step.input ?? {}, context);
    if (isErr(result)) {
      return result;
    }
    return ok(withVariable(context, step.output, result.value));
  }

  private async execWorkflow(
    step: WorkflowStep,
    context: GeneratorContext,
  ): Promise<Result<GeneratorContext, GeneratorError>> {
    if (this.deps.workflow === undefined) {
      return err(
        new GeneratorNotImplementedError("Workflow coordination requires a WorkflowRunner."),
      );
    }
    const result = await this.deps.workflow.run(step.workflowId, step.input ?? {});
    if (isErr(result)) {
      return result;
    }
    return ok(withVariable(context, step.output, { ...result.value }));
  }

  private async execPrompt(
    step: PromptStep,
    context: GeneratorContext,
  ): Promise<Result<GeneratorContext, GeneratorError>> {
    if (this.deps.prompt === undefined) {
      return err(new GeneratorNotImplementedError("Prompt coordination requires a PromptRunner."));
    }
    const result = await this.deps.prompt.render(step.templateId, step.variables);
    if (isErr(result)) {
      return result;
    }
    return ok(withVariable(context, step.output, result.value));
  }

  private async execAI(
    step: AIStep,
    context: GeneratorContext,
  ): Promise<Result<GeneratorContext, GeneratorError>> {
    if (this.deps.ai === undefined) {
      return err(new GeneratorNotImplementedError("AI coordination requires an AIRunner."));
    }
    const result = await this.deps.ai.run({
      ...(step.input !== undefined ? { input: step.input } : {}),
      ...(step.templateId !== undefined ? { templateId: step.templateId } : {}),
      ...(step.variables !== undefined ? { variables: step.variables } : {}),
    });
    if (isErr(result)) {
      return result;
    }
    return ok(withVariable(context, step.output, result.value));
  }
}
