/**
 * {@link WorkflowExecutor} — runs a compiled {@link Workflow} node tree against a
 * context, applying retry/timeout/rollback policies, evaluating conditions,
 * running parallel branches and loops, resolving subworkflows, and emitting
 * events/metrics throughout. Prepared step kinds (`approval`, `tool`) go through
 * optional ports and otherwise report `NotImplemented`.
 */
import { err, isErr, isOk, ok, type Logger, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import type { Workflow } from "../domain/definition.js";
import {
  createContext,
  withOutput,
  withState,
  withVariable,
  type WorkflowContext,
} from "../domain/context.js";
import type { StepResult, WorkflowResult } from "../domain/result.js";
import type {
  BranchStep,
  LoopStep,
  ParallelStep,
  SequenceStep,
  SubworkflowStep,
  TaskStep,
  ToolStep,
  ApprovalStep,
  WorkflowStep,
} from "../domain/step.js";
import type { WorkflowEngineConfig } from "../config.js";
import {
  StepExecutionError,
  WorkflowNotFoundError,
  WorkflowNotImplementedError,
  type WorkflowError,
} from "../errors.js";
import type { EventBus, WorkflowEvents } from "../events.js";
import type {
  ConditionEvaluator,
  HumanApprovalGateway,
  MetricsSink,
  StepHandler,
  ToolInvoker,
} from "../interfaces.js";
import type { StepHandlerRegistry } from "../handlers/registry.js";
import { withTimeout } from "./timeout.js";
import { systemClock, type Clock } from "../utils.js";

/** Collaborators for {@link WorkflowExecutor}. */
export interface ExecutorDeps {
  readonly handlers: StepHandlerRegistry;
  readonly evaluator: ConditionEvaluator;
  readonly events: EventBus<WorkflowEvents>;
  readonly metrics: MetricsSink;
  readonly config: WorkflowEngineConfig;
  readonly resolveWorkflow: (id: string) => Workflow | undefined;
  readonly logger?: Logger;
  readonly clock?: Clock;
  readonly approval?: HumanApprovalGateway;
  readonly tools?: ToolInvoker;
}

interface RollbackEntry {
  readonly handler: StepHandler;
  readonly input: Readonly<Record<string, StructuredValue>>;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export class WorkflowExecutor {
  private readonly clock: Clock;

  public constructor(private readonly deps: ExecutorDeps) {
    this.clock = deps.clock ?? systemClock;
  }

  public async run(
    workflow: Workflow,
    input: Readonly<Record<string, StructuredValue>> = {},
    runId = `${workflow.id}-${String(this.clock.now().getTime())}`,
  ): Promise<WorkflowResult> {
    const startedAt = this.clock.now().getTime();
    const results: StepResult[] = [];
    const rollback: RollbackEntry[] = [];
    let context = withState(createContext(workflow.id, runId, input), "running");
    this.deps.events.emit("workflow.started", { workflowId: workflow.id, runId });

    const outcome = await this.execStep(workflow.root, context, results, rollback, runId);
    const durationMs = this.clock.now().getTime() - startedAt;

    if (isErr(outcome)) {
      let state: WorkflowResult["state"] = "failed";
      if (workflow.onFailure === "rollback") {
        await this.runRollback(rollback, context);
        state = "rolled-back";
        this.deps.events.emit("workflow.rolledback", { workflowId: workflow.id, runId });
      }
      this.deps.metrics.increment("workflow.failed");
      this.deps.events.emit("workflow.failed", {
        workflowId: workflow.id,
        runId,
        error: outcome.error,
      });
      return {
        workflowId: workflow.id,
        runId,
        state,
        output: context.outputs,
        steps: results,
        durationMs,
        error: outcome.error.message,
      };
    }

    context = withState(outcome.value, "completed");
    this.deps.metrics.increment("workflow.completed");
    this.deps.events.emit("workflow.completed", {
      workflowId: workflow.id,
      runId,
      state: "completed",
    });
    return {
      workflowId: workflow.id,
      runId,
      state: "completed",
      output: context.outputs,
      steps: results,
      durationMs,
    };
  }

  private async execStep(
    step: WorkflowStep,
    context: WorkflowContext,
    results: StepResult[],
    rollback: RollbackEntry[],
    runId: string,
  ): Promise<Result<WorkflowContext, WorkflowError>> {
    switch (step.kind) {
      case "task":
        return this.execTask(step, context, results, rollback, runId);
      case "sequence":
        return this.execSequence(step, context, results, rollback, runId);
      case "parallel":
        return this.execParallel(step, context, results, rollback, runId);
      case "branch":
        return this.execBranch(step, context, results, rollback, runId);
      case "loop":
        return this.execLoop(step, context, results, rollback, runId);
      case "subworkflow":
        return this.execSubworkflow(step, context, results, rollback, runId);
      case "approval":
        return this.execApproval(step, context);
      case "tool":
        return this.execTool(step, context);
      default:
        return err(new StepExecutionError("Unsupported step kind.", "unknown"));
    }
  }

  private async execSequence(
    step: SequenceStep,
    context: WorkflowContext,
    results: StepResult[],
    rollback: RollbackEntry[],
    runId: string,
  ): Promise<Result<WorkflowContext, WorkflowError>> {
    let current = context;
    for (const child of step.steps) {
      const outcome = await this.execStep(child, current, results, rollback, runId);
      if (isErr(outcome)) {
        return outcome;
      }
      current = outcome.value;
    }
    return ok(current);
  }

  private async execParallel(
    step: ParallelStep,
    context: WorkflowContext,
    results: StepResult[],
    rollback: RollbackEntry[],
    runId: string,
  ): Promise<Result<WorkflowContext, WorkflowError>> {
    this.deps.events.emit("step.started", { runId, stepId: step.id, kind: "parallel" });
    const outcomes = await Promise.all(
      step.branches.map((branch) => this.execStep(branch, context, results, rollback, runId)),
    );
    let merged = context;
    for (const outcome of outcomes) {
      if (isErr(outcome)) {
        return outcome;
      }
      merged = {
        ...merged,
        variables: { ...merged.variables, ...outcome.value.variables },
        outputs: { ...merged.outputs, ...outcome.value.outputs },
      };
    }
    this.deps.events.emit("parallel.joined", {
      runId,
      stepId: step.id,
      branches: step.branches.length,
    });
    return ok(merged);
  }

  private async execBranch(
    step: BranchStep,
    context: WorkflowContext,
    results: StepResult[],
    rollback: RollbackEntry[],
    runId: string,
  ): Promise<Result<WorkflowContext, WorkflowError>> {
    const taken = this.deps.evaluator.evaluate(step.condition, context);
    this.deps.events.emit("branch.evaluated", { runId, stepId: step.id, result: taken });
    const chosen = taken ? step.then : (step.otherwise ?? []);
    let current = context;
    for (const child of chosen) {
      const outcome = await this.execStep(child, current, results, rollback, runId);
      if (isErr(outcome)) {
        return outcome;
      }
      current = outcome.value;
    }
    return ok(current);
  }

  private async execLoop(
    step: LoopStep,
    context: WorkflowContext,
    results: StepResult[],
    rollback: RollbackEntry[],
    runId: string,
  ): Promise<Result<WorkflowContext, WorkflowError>> {
    let current = context;
    const cap = Math.min(step.maxIterations, this.deps.config.maxLoopIterations);
    for (let iteration = 0; iteration < cap; iteration += 1) {
      if (step.condition !== undefined && !this.deps.evaluator.evaluate(step.condition, current)) {
        break;
      }
      this.deps.events.emit("loop.iteration", { runId, stepId: step.id, iteration });
      for (const child of step.body) {
        const outcome = await this.execStep(child, current, results, rollback, runId);
        if (isErr(outcome)) {
          return outcome;
        }
        current = outcome.value;
      }
    }
    return ok(current);
  }

  private async execSubworkflow(
    step: SubworkflowStep,
    context: WorkflowContext,
    results: StepResult[],
    rollback: RollbackEntry[],
    runId: string,
  ): Promise<Result<WorkflowContext, WorkflowError>> {
    const workflow = this.deps.resolveWorkflow(step.workflowId);
    if (workflow === undefined) {
      return err(new WorkflowNotFoundError(`Subworkflow "${step.workflowId}" not found.`));
    }
    const childContext = withState(
      createContext(workflow.id, `${runId}:${step.id}`, step.input ?? {}),
      "running",
    );
    const outcome = await this.execStep(workflow.root, childContext, results, rollback, runId);
    if (isErr(outcome)) {
      return outcome;
    }
    if (step.output !== undefined) {
      const childOutputs: StructuredValue = { ...outcome.value.outputs };
      return ok(
        withOutput(withVariable(context, step.output, childOutputs), step.output, childOutputs),
      );
    }
    return ok(context);
  }

  private async execTask(
    step: TaskStep,
    context: WorkflowContext,
    results: StepResult[],
    rollback: RollbackEntry[],
    runId: string,
  ): Promise<Result<WorkflowContext, WorkflowError>> {
    this.deps.events.emit("step.started", { runId, stepId: step.id, kind: "task" });
    const startedAt = this.clock.now().getTime();
    const handler = this.deps.handlers.get(step.handler);
    if (handler === undefined) {
      const error = new StepExecutionError(`Handler "${step.handler}" is not registered.`, step.id);
      results.push(this.failedResult(step, "task", 1, startedAt, error.message));
      this.deps.events.emit("step.failed", { runId, stepId: step.id, error });
      return err(error);
    }

    const input = step.input ?? {};
    const maxAttempts = Math.max(1, step.retry?.maxAttempts ?? 1);
    const baseDelay = step.retry?.baseDelayMs ?? 0;
    const timeoutMs = step.timeout?.timeoutMs ?? this.deps.config.defaultStepTimeoutMs;

    let last: Result<StructuredValue, WorkflowError> = err(
      new StepExecutionError("Step did not run.", step.id),
    );
    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts += 1;
      const safeOp = (async (): Promise<Result<StructuredValue, WorkflowError>> => {
        try {
          return await handler(input, context);
        } catch (cause) {
          return err(new StepExecutionError(String(cause), step.id, { cause }));
        }
      })();
      last = await withTimeout(safeOp, timeoutMs, step.id);
      if (isOk(last)) {
        break;
      }
      if (attempts < maxAttempts) {
        this.deps.events.emit("step.retried", { runId, stepId: step.id, attempt: attempts });
        if (baseDelay > 0) {
          await sleep(baseDelay * attempts);
        }
      }
    }

    const durationMs = this.clock.now().getTime() - startedAt;
    if (isErr(last)) {
      results.push(
        this.failedResult(step, "task", attempts, startedAt, last.error.message, durationMs),
      );
      this.deps.metrics.increment("workflow.step.failed");
      this.deps.events.emit("step.failed", { runId, stepId: step.id, error: last.error });
      return err(last.error);
    }

    let updated = context;
    if (step.output !== undefined) {
      updated = withOutput(withVariable(updated, step.output, last.value), step.output, last.value);
    }
    if (step.rollback !== undefined) {
      const rollbackHandler = this.deps.handlers.get(step.rollback.handler);
      if (rollbackHandler !== undefined) {
        rollback.push({ handler: rollbackHandler, input: step.rollback.input ?? {} });
      }
    }
    results.push({
      stepId: step.id,
      kind: "task",
      state: "completed",
      attempts,
      durationMs,
      output: last.value,
    });
    this.deps.metrics.increment("workflow.step.completed");
    this.deps.events.emit("step.completed", { runId, stepId: step.id });
    return ok(updated);
  }

  private async execApproval(
    step: ApprovalStep,
    context: WorkflowContext,
  ): Promise<Result<WorkflowContext, WorkflowError>> {
    if (this.deps.approval === undefined) {
      return err(
        new WorkflowNotImplementedError("Human approval is prepared but no gateway is configured."),
      );
    }
    const decision = await this.deps.approval.request(
      { stepId: step.id, prompt: step.prompt },
      context,
    );
    if (isErr(decision)) {
      return decision;
    }
    return decision.value
      ? ok(context)
      : err(new StepExecutionError("Approval was rejected.", step.id));
  }

  private async execTool(
    step: ToolStep,
    context: WorkflowContext,
  ): Promise<Result<WorkflowContext, WorkflowError>> {
    if (this.deps.tools === undefined) {
      return err(
        new WorkflowNotImplementedError(
          "Tool invocation is prepared but no invoker is configured.",
        ),
      );
    }
    const invoked = await this.deps.tools.invoke(
      { tool: step.tool, input: step.input ?? {} },
      context,
    );
    if (isErr(invoked)) {
      return invoked;
    }
    if (step.output !== undefined) {
      return ok(
        withOutput(withVariable(context, step.output, invoked.value), step.output, invoked.value),
      );
    }
    return ok(context);
  }

  private async runRollback(
    rollback: readonly RollbackEntry[],
    context: WorkflowContext,
  ): Promise<void> {
    for (const entry of [...rollback].reverse()) {
      try {
        await entry.handler(entry.input, context);
      } catch {
        // Rollback is best-effort; ignore failures.
      }
    }
  }

  private failedResult(
    step: WorkflowStep,
    kind: StepResult["kind"],
    attempts: number,
    startedAt: number,
    error: string,
    durationMs?: number,
  ): StepResult {
    return {
      stepId: step.id,
      kind,
      state: "failed",
      attempts,
      durationMs: durationMs ?? this.clock.now().getTime() - startedAt,
      error,
    };
  }
}
