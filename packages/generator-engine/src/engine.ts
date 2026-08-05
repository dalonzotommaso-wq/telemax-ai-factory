/**
 * {@link GeneratorEngine} — the façade that registers, compiles, versions, runs
 * and (de)serializes generators, producing artifacts. It coordinates the
 * Workflow, AI, Prompt and Knowledge engines through injected runners and stays
 * completely target-agnostic. Callers depend only on this class.
 */
import { isErr, ok, type Logger, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import type { WorkflowEngine } from "@telemax/workflow";
import type { AIOrchestrator } from "@telemax/ai";
import type { PromptEngine } from "@telemax/prompt-engine";
import { DEFAULT_GENERATOR_CONFIG, type GeneratorEngineConfig } from "./config.js";
import type { Generator, GeneratorDefinition } from "./domain/definition.js";
import type { GeneratorError } from "./errors.js";
import type { GeneratorResult } from "./domain/result.js";
import type { GeneratorTemplate } from "./domain/template.js";
import type { GeneratorVersion } from "./domain/version.js";
import { GeneratorEventBus, type EventBus, type GeneratorEvents } from "./events.js";
import { NoopMetricsSink } from "./metrics.js";
import { InMemoryResultCache } from "./cache.js";
import { DefaultTemplateRenderer } from "./template/renderer.js";
import { GeneratorTemplateRepository } from "./template/repository.js";
import { InMemoryArtifactWriter } from "./artifact/writer.js";
import { GeneratorTransformRegistry } from "./transforms/registry.js";
import { registerBuiltinTransforms } from "./transforms/builtin.js";
import { GeneratorExecution } from "./execution/execution.js";
import { GeneratorFactory } from "./factory.js";
import { GeneratorValidator } from "./validator.js";
import { GeneratorRegistry } from "./registry.js";
import { ExportManager, type GeneratorBundle } from "./export-manager.js";
import { ImportManager } from "./import-manager.js";
import { aiRunner, promptRunner, workflowRunner } from "./runners/adapters.js";
import type {
  AIRunner,
  ArtifactWriter,
  GeneratorResultCache,
  GeneratorTransform,
  KnowledgeRunner,
  MetricsSink,
  PromptRunner,
  TemplateRenderer,
  WorkflowRunner,
} from "./interfaces.js";
import { asGeneratorId } from "./types.js";
import { hashValue, systemClock, uuidIdGenerator, type Clock, type IdGenerator } from "./utils.js";

/** Collaborators for {@link GeneratorEngine}. All optional; safe defaults apply. */
export interface GeneratorEngineDeps {
  readonly config?: GeneratorEngineConfig;
  readonly events?: EventBus<GeneratorEvents>;
  readonly metrics?: MetricsSink;
  readonly logger?: Logger;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
  readonly renderer?: TemplateRenderer;
  readonly writer?: ArtifactWriter;
  readonly templates?: GeneratorTemplateRepository;
  readonly transforms?: GeneratorTransformRegistry;
  readonly cache?: GeneratorResultCache;
  readonly workflow?: WorkflowRunner;
  readonly ai?: AIRunner;
  readonly prompt?: PromptRunner;
  readonly knowledge?: KnowledgeRunner;
}

export class GeneratorEngine {
  public readonly templates: GeneratorTemplateRepository;
  public readonly transforms: GeneratorTransformRegistry;

  private readonly config: GeneratorEngineConfig;
  private readonly events: EventBus<GeneratorEvents>;
  private readonly metrics: MetricsSink;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly renderer: TemplateRenderer;
  private readonly writer: ArtifactWriter;
  private readonly cache: GeneratorResultCache | undefined;
  private readonly registry: GeneratorRegistry;
  private readonly factory: GeneratorFactory;
  private readonly exporter: ExportManager;
  private readonly importer: ImportManager;
  private readonly definitions = new Map<string, GeneratorDefinition>();
  private readonly logger: Logger | undefined;

  private workflow: WorkflowRunner | undefined;
  private ai: AIRunner | undefined;
  private prompt: PromptRunner | undefined;
  private knowledge: KnowledgeRunner | undefined;

  public constructor(deps: GeneratorEngineDeps = {}) {
    this.config = deps.config ?? DEFAULT_GENERATOR_CONFIG;
    this.events = deps.events ?? new GeneratorEventBus();
    this.metrics = deps.metrics ?? new NoopMetricsSink();
    this.clock = deps.clock ?? systemClock;
    this.ids = deps.ids ?? uuidIdGenerator;
    this.renderer = deps.renderer ?? new DefaultTemplateRenderer();
    this.writer = deps.writer ?? new InMemoryArtifactWriter();
    this.templates = deps.templates ?? new GeneratorTemplateRepository();
    this.transforms = deps.transforms ?? new GeneratorTransformRegistry();
    registerBuiltinTransforms(this.transforms);
    this.logger = deps.logger;
    this.workflow = deps.workflow;
    this.ai = deps.ai;
    this.prompt = deps.prompt;
    this.knowledge = deps.knowledge;
    this.registry = new GeneratorRegistry(this.config.enableVersioning, this.clock);
    this.factory = new GeneratorFactory(
      new GeneratorValidator(),
      this.clock,
      this.config.defaultLanguage,
      this.config.defaultTarget ?? "generic",
    );
    this.exporter = new ExportManager(this.clock);
    this.importer = new ImportManager((definition) => this.registerGenerator(definition));
    this.cache =
      deps.cache ??
      (this.config.cache.enabled
        ? new InMemoryResultCache(this.config.cache.maxEntries)
        : undefined);
  }

  /** Subscribe to a generator event; returns an unsubscribe function. */
  public on<K extends keyof GeneratorEvents>(
    event: K,
    handler: (payload: GeneratorEvents[K]) => void,
  ): () => void {
    return this.events.on(event, handler);
  }

  /** Register a global output template. */
  public registerTemplate(template: GeneratorTemplate): void {
    this.templates.register(template);
  }

  /** Register a transform by id. */
  public registerTransform(id: string, transform: GeneratorTransform): void {
    this.transforms.register(id, transform);
  }

  /** Wire the Workflow Engine as a coordination runner. */
  public useWorkflow(engine: WorkflowEngine): void {
    this.workflow = workflowRunner(engine);
  }

  /** Wire the AI Orchestrator as a coordination runner. */
  public useAI(orchestrator: AIOrchestrator): void {
    this.ai = aiRunner(orchestrator);
  }

  /** Wire the Prompt Engine as a coordination runner. */
  public usePrompt(engine: PromptEngine): void {
    this.prompt = promptRunner(engine);
  }

  /** Wire a Knowledge retriever as a coordination runner. */
  public useKnowledge(runner: KnowledgeRunner): void {
    this.knowledge = runner;
  }

  /** Compile, validate, version and store a generator definition. */
  public registerGenerator(definition: GeneratorDefinition): Result<Generator, GeneratorError> {
    const compiled = this.factory.create(definition);
    if (isErr(compiled)) {
      return compiled;
    }
    let generator = compiled.value;
    const existing = this.registry.get(generator.id);
    if (!isErr(existing)) {
      generator = generator.withVersion(existing.value.version + 1, generator.metadata);
    }
    this.registry.save(generator);
    this.definitions.set(definition.id, definition);
    this.events.emit("generator.registered", {
      generatorId: generator.id,
      version: generator.version,
    });
    return ok(generator);
  }

  /** Retrieve a compiled generator by id. */
  public getGenerator(id: string): Result<Generator, GeneratorError> {
    return this.registry.get(asGeneratorId(id));
  }

  /** List all compiled generators. */
  public listGenerators(): readonly Generator[] {
    return this.registry.list();
  }

  /** Retrieve the version history of a generator. */
  public getVersions(id: string): readonly GeneratorVersion[] {
    return this.registry.versions(asGeneratorId(id));
  }

  /** Run a generator and return its result (artifacts + variables). */
  public async generate(
    id: string,
    variables: Readonly<Record<string, StructuredValue>> = {},
  ): Promise<Result<GeneratorResult, GeneratorError>> {
    const found = this.registry.get(asGeneratorId(id));
    if (isErr(found)) {
      return found;
    }
    const generator = found.value;
    const cacheKey = `${generator.signature}:${hashValue(variables)}`;
    const cached = this.cache?.get(cacheKey);
    if (cached !== undefined) {
      this.events.emit("cache.hit", { key: cacheKey });
      this.metrics.increment("generator.cache.hit");
      return ok(cached);
    }
    this.events.emit("cache.miss", { key: cacheKey });
    this.metrics.increment("generator.cache.miss");

    const templates = new GeneratorTemplateRepository();
    for (const template of this.templates.list()) {
      templates.register(template);
    }
    for (const template of generator.templates) {
      templates.register(template);
    }

    const execution = new GeneratorExecution({
      templates,
      renderer: this.renderer,
      transforms: this.transforms,
      writer: this.writer,
      events: this.events,
      metrics: this.metrics,
      clock: this.clock,
      ...(this.workflow !== undefined ? { workflow: this.workflow } : {}),
      ...(this.ai !== undefined ? { ai: this.ai } : {}),
      ...(this.prompt !== undefined ? { prompt: this.prompt } : {}),
      ...(this.knowledge !== undefined ? { knowledge: this.knowledge } : {}),
    });

    const runId = `${id}-${this.ids.next()}`;
    const result = await execution.run(generator, variables, runId);
    if (result.state === "completed") {
      this.cache?.set(cacheKey, result);
    }
    this.logger?.debug("generation finished", { runId });
    return ok(result);
  }

  /** Export all registered generator definitions into a bundle. */
  public exportBundle(): GeneratorBundle {
    const bundle = this.exporter.export([...this.definitions.values()]);
    this.events.emit("export.completed", { exported: bundle.generators.length });
    return bundle;
  }

  /** Import generators from a bundle. */
  public importBundle(bundle: GeneratorBundle): Result<readonly Generator[], GeneratorError> {
    const result = this.importer.import(bundle);
    if (!isErr(result)) {
      this.events.emit("import.completed", { imported: result.value.length });
    }
    return result;
  }
}
