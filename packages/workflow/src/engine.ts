/**
 * {@link WorkflowEngine} — the façade that compiles, stores, runs, schedules and
 * (de)serializes workflows, coordinating the other engines through registered
 * step handlers (AI Orchestrator, Prompt Engine, Knowledge retrieval). Callers
 * depend only on this class; every collaborator is injected behind a port.
 */
import { isErr, ok, type Logger, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import type { AIOrchestrator } from "@telemax/ai";
import type { PromptEngine } from "@telemax/prompt-engine";
import { DEFAULT_WORKFLOW_CONFIG, type WorkflowEngineConfig } from "./config.js";
import type { Workflow, WorkflowDefinition } from "./domain/definition.js";
import type { WorkflowResult } from "./domain/result.js";
import type { ScheduleEntry } from "./domain/schedule.js";
import type { WorkflowError } from "./errors.js";
import { WorkflowEventBus, type EventBus, type WorkflowEvents } from "./events.js";
import { NoopMetricsSink } from "./metrics.js";
import { DefaultConditionEvaluator } from "./condition/evaluator.js";
import { StepHandlerRegistry } from "./handlers/registry.js";
import { registerBuiltinHandlers } from "./handlers/builtin.js";
import { aiStepHandler, promptStepHandler } from "./handlers/adapters.js";
import { WorkflowExecutor } from "./execution/executor.js";
import { WorkflowCompiler } from "./compiler.js";
import { WorkflowValidator } from "./validator.js";
import { WorkflowRegistry, type WorkflowVersion } from "./registry.js";
import { WorkflowScheduler } from "./scheduler.js";
import { ExportManager, type WorkflowBundle } from "./export-manager.js";
import { ImportManager } from "./import-manager.js";
import type {
  ConditionEvaluator,
  HumanApprovalGateway,
  MetricsSink,
  StepHandler,
  ToolInvoker,
} from "./interfaces.js";
import { asWorkflowId } from "./types.js";
import { systemClock, uuidIdGenerator, type Clock, type IdGenerator } from "./utils.js";

/** Collaborators for {@link WorkflowEngine}. All optional; safe defaults apply. */
export interface WorkflowEngineDeps {
  readonly config?: WorkflowEngineConfig;
  readonly events?: EventBus<WorkflowEvents>;
  readonly metrics?: MetricsSink;
  readonly logger?: Logger;
  readonly handlers?: StepHandlerRegistry;
  readonly evaluator?: ConditionEvaluator;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
  readonly approval?: HumanApprovalGateway;
  readonly tools?: ToolInvoker;
}

export class WorkflowEngine {
  public readonly handlers: StepHandlerRegistry;
  public readonly scheduler: WorkflowScheduler;

  private readonly config: WorkflowEngineConfig;
  private readonly events: EventBus<WorkflowEvents>;
  private readonly metrics: MetricsSink;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly registry: WorkflowRegistry;
  private readonly compiler: WorkflowCompiler;
  private readonly executor: WorkflowExecutor;
  private readonly exporter: ExportManager;
  private readonly importer: ImportManager;
  private readonly definitions = new Map<string, WorkflowDefinition>();

  public constructor(deps: WorkflowEngineDeps = {}) {
    this.config = deps.config ?? DEFAULT_WORKFLOW_CONFIG;
    this.events = deps.events ?? new WorkflowEventBus();
    this.metrics = deps.metrics ?? new NoopMetricsSink();
    this.clock = deps.clock ?? systemClock;
    this.ids = deps.ids ?? uuidIdGenerator;
    this.handlers = deps.handlers ?? new StepHandlerRegistry();
    registerBuiltinHandlers(this.handlers);
    const evaluator: ConditionEvaluator = deps.evaluator ?? new DefaultConditionEvaluator();
    this.registry = new WorkflowRegistry(this.config.enableVersioning, this.clock);
    this.compiler = new WorkflowCompiler(
      new WorkflowValidator(),
      this.clock,
      this.config.defaultLanguage,
    );
    this.scheduler = new WorkflowScheduler();
    this.exporter = new ExportManager(this.clock);
    this.importer = new ImportManager((definition) => this.registerWorkflow(definition));
    this.executor = new WorkflowExecutor({
      handlers: this.handlers,
      evaluator,
      events: this.events,
      metrics: this.metrics,
      config: this.config,
      resolveWorkflow: (id) => this.registry.resolve(id),
      clock: this.clock,
      ...(deps.logger !== undefined ? { logger: deps.logger } : {}),
      ...(deps.approval !== undefined ? { approval: deps.approval } : {}),
      ...(deps.tools !== undefined ? { tools: deps.tools } : {}),
    });
  }

  /** Subscribe to a workflow event; returns an unsubscribe function. */
  public on<K extends keyof WorkflowEvents>(
    event: K,
    handler: (payload: WorkflowEvents[K]) => void,
  ): () => void {
    return this.events.on(event, handler);
  }

  /** Register a task handler by id. */
  public registerHandler(id: string, handler: StepHandler): void {
    this.handlers.register(id, handler);
  }

  /** Register an AI Orchestrator as a step handler. */
  public registerAI(id: string, orchestrator: AIOrchestrator): void {
    this.handlers.register(id, aiStepHandler(orchestrator));
  }

  /** Register a Prompt Engine as a step handler. */
  public registerPrompt(id: string, engine: PromptEngine): void {
    this.handlers.register(id, promptStepHandler(engine));
  }

  /** Compile, validate, version and store a workflow definition. */
  public registerWorkflow(definition: WorkflowDefinition): Result<Workflow, WorkflowError> {
    const compiled = this.compiler.compile(definition);
    if (isErr(compiled)) {
      return compiled;
    }
    let workflow = compiled.value;
    const existing = this.registry.get(workflow.id);
    if (!isErr(existing)) {
      workflow = workflow.withVersion(existing.value.version + 1, workflow.metadata);
    }
    this.registry.save(workflow);
    this.definitions.set(definition.id, definition);
    this.events.emit("workflow.registered", {
      workflowId: workflow.id,
      version: workflow.version,
    });
    return ok(workflow);
  }

  /** Retrieve a compiled workflow by id. */
  public getWorkflow(id: string): Result<Workflow, WorkflowError> {
    return this.registry.get(asWorkflowId(id));
  }

  /** List all compiled workflows. */
  public listWorkflows(): readonly Workflow[] {
    return this.registry.list();
  }

  /** Retrieve the version history of a workflow. */
  public getVersions(id: string): readonly WorkflowVersion[] {
    return this.registry.versions(asWorkflowId(id));
  }

  /** Run a workflow and return its result. */
  public async run(
    id: string,
    input: Readonly<Record<string, StructuredValue>> = {},
  ): Promise<Result<WorkflowResult, WorkflowError>> {
    const workflow = this.registry.get(asWorkflowId(id));
    if (isErr(workflow)) {
      return workflow;
    }
    const runId = `${id}-${this.ids.next()}`;
    const result = await this.executor.run(workflow.value, input, runId);
    return ok(result);
  }

  /** Register a schedule entry (one-shot `runAt`; cron/distributed prepared). */
  public schedule(entry: ScheduleEntry): void {
    this.scheduler.schedule(entry);
    this.events.emit("workflow.scheduled", { workflowId: entry.workflowId, scheduleId: entry.id });
  }

  /** Run all schedules due at `nowIso`, returning their results. */
  public async runDue(nowIso: string): Promise<readonly WorkflowResult[]> {
    const results: WorkflowResult[] = [];
    for (const entry of this.scheduler.due(nowIso)) {
      const outcome = await this.run(entry.workflowId, entry.input ?? {});
      if (!isErr(outcome)) {
        results.push(outcome.value);
      }
    }
    return results;
  }

  /** Export all registered workflow definitions into a bundle. */
  public exportBundle(): WorkflowBundle {
    const bundle = this.exporter.export([...this.definitions.values()]);
    this.events.emit("export.completed", { exported: bundle.workflows.length });
    return bundle;
  }

  /** Import workflows from a bundle. */
  public importBundle(bundle: WorkflowBundle): Result<readonly Workflow[], WorkflowError> {
    const result = this.importer.import(bundle);
    if (!isErr(result)) {
      this.events.emit("import.completed", { imported: result.value.length });
    }
    return result;
  }
}
