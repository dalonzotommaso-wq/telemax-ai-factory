/**
 * {@link AIOrchestrator} — the façade that coordinates every module of the
 * framework to turn a request into a standardized response.
 *
 * Flow: receive request → retrieve context from the Knowledge Engine → build the
 * prompt via the Prompt Engine → select provider → select model → prepare the
 * request → execute through the resilience stack → return a standardized
 * {@link ExecutionResult}. It is provider-agnostic and performs no HTTP, uses no
 * credentials and connects to no external service; the shipped provider is a
 * local deterministic stub.
 */
import { isErr, ok, type Logger, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import type { PromptEngine } from "@telemax/prompt-engine";
import { DEFAULT_ORCHESTRATOR_CONFIG, type OrchestratorConfig } from "./config.js";
import { ContextBuilder } from "./conversation/context-builder.js";
import { ConversationManager } from "./conversation/conversation-manager.js";
import type { Context } from "./domain/context.js";
import { message, type Message } from "./domain/message.js";
import type { ModelDescriptor } from "./domain/model.js";
import type { GenerationParams, AIRequest, PreparedRequest } from "./domain/request.js";
import type { AIResponse, AIResponseChunk } from "./domain/response.js";
import type { ExecutionResult } from "./domain/execution.js";
import { AIEventBus, type AIEvents, type EventBus } from "./events.js";
import type { AIError } from "./errors.js";
import { InMemoryResponseCache } from "./cache/cache-manager.js";
import { DefaultCostCalculator, CostTracker } from "./cost/cost-tracker.js";
import { NoopMetricsSink } from "./telemetry/telemetry.js";
import { DefaultCircuitBreaker } from "./resilience/circuit-breaker.js";
import { DefaultHealthMonitor } from "./resilience/health-monitor.js";
import { DefaultRetryPolicy } from "./resilience/retry-policy.js";
import { TokenBucketRateLimiter } from "./resilience/rate-limiter.js";
import { DefaultStreamingManager } from "./streaming/streaming-manager.js";
import { AIProviderRegistry } from "./providers/provider-registry.js";
import { ModelRegistry } from "./providers/model-registry.js";
import { DefaultModelSelector, DefaultProviderSelector } from "./providers/selection.js";
import { ExecutionPipeline } from "./pipeline/execution-pipeline.js";
import { KnowledgePipeline } from "./pipeline/knowledge-pipeline.js";
import { PromptPipeline } from "./pipeline/prompt-pipeline.js";
import type {
  AIProvider,
  CircuitBreaker,
  CostCalculator,
  CostSink,
  HealthMonitor,
  KnowledgeGateway,
  MetricsSink,
  ModelSelector,
  ProviderSelector,
  RateLimiter,
  ResponseCache,
  RetryPolicy,
  StreamingManager,
  TokenCounter,
} from "./interfaces.js";
import { hashValue, systemClock, uuidIdGenerator, type Clock, type IdGenerator } from "./utils.js";
import type { ModelId, ProviderId } from "./types.js";

/** Collaborators for {@link AIOrchestrator}. All optional; safe defaults apply. */
export interface AIOrchestratorDeps {
  readonly providerRegistry?: AIProviderRegistry;
  readonly modelRegistry?: ModelRegistry;
  readonly providerSelector?: ProviderSelector;
  readonly modelSelector?: ModelSelector;
  readonly promptEngine?: PromptEngine;
  readonly knowledgeGateway?: KnowledgeGateway;
  readonly executionPipeline?: ExecutionPipeline;
  readonly retryPolicy?: RetryPolicy;
  readonly circuitBreaker?: CircuitBreaker;
  readonly rateLimiter?: RateLimiter;
  readonly healthMonitor?: HealthMonitor;
  readonly tokenCounter?: TokenCounter;
  readonly costCalculator?: CostCalculator;
  readonly costTracker?: CostSink;
  readonly cache?: ResponseCache;
  readonly metrics?: MetricsSink;
  readonly events?: EventBus<AIEvents>;
  readonly logger?: Logger;
  readonly streamingManager?: StreamingManager;
  readonly conversationManager?: ConversationManager;
  readonly contextBuilder?: ContextBuilder;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
  readonly config?: OrchestratorConfig;
}

interface Prepared {
  readonly provider: AIProvider;
  readonly model: ModelDescriptor;
  readonly prepared: PreparedRequest;
  readonly context: Context;
}

export class AIOrchestrator {
  public readonly providers: AIProviderRegistry;
  public readonly models: ModelRegistry;
  public readonly conversations: ConversationManager;
  public readonly costs: CostSink;

  private readonly providerSelector: ProviderSelector;
  private readonly modelSelector: ModelSelector;
  private readonly promptPipeline: PromptPipeline;
  private readonly knowledgePipeline: KnowledgePipeline;
  private readonly executionPipeline: ExecutionPipeline;
  private readonly contextBuilder: ContextBuilder;
  private readonly costCalculator: CostCalculator;
  private readonly cache: ResponseCache | undefined;
  private readonly metrics: MetricsSink;
  private readonly events: EventBus<AIEvents>;
  private readonly logger: Logger | undefined;
  private readonly streamingManager: StreamingManager;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly config: OrchestratorConfig;

  public constructor(deps: AIOrchestratorDeps = {}) {
    this.config = deps.config ?? DEFAULT_ORCHESTRATOR_CONFIG;
    this.providers = deps.providerRegistry ?? new AIProviderRegistry();
    this.models = deps.modelRegistry ?? new ModelRegistry();
    this.providerSelector =
      deps.providerSelector ?? new DefaultProviderSelector(this.config.defaultProvider);
    this.modelSelector = deps.modelSelector ?? new DefaultModelSelector(this.config.defaultModel);
    this.promptPipeline = new PromptPipeline(deps.promptEngine);
    this.knowledgePipeline = new KnowledgePipeline(deps.knowledgeGateway);
    this.contextBuilder = deps.contextBuilder ?? new ContextBuilder();
    this.costCalculator = deps.costCalculator ?? new DefaultCostCalculator();
    this.costs = deps.costTracker ?? new CostTracker();
    this.metrics = deps.metrics ?? new NoopMetricsSink();
    this.events = deps.events ?? new AIEventBus();
    this.logger = deps.logger;
    this.streamingManager = deps.streamingManager ?? new DefaultStreamingManager();
    this.conversations = deps.conversationManager ?? new ConversationManager();
    this.clock = deps.clock ?? systemClock;
    this.ids = deps.ids ?? uuidIdGenerator;
    this.cache =
      deps.cache ??
      (this.config.cache.enabled
        ? new InMemoryResponseCache(this.config.cache.maxEntries)
        : undefined);
    this.executionPipeline =
      deps.executionPipeline ??
      new ExecutionPipeline({
        retry:
          deps.retryPolicy ??
          new DefaultRetryPolicy(this.config.retry.maxAttempts, this.config.retry.baseDelayMs),
        breaker:
          deps.circuitBreaker ??
          new DefaultCircuitBreaker(
            this.config.circuitBreaker.failureThreshold,
            this.config.circuitBreaker.resetTimeoutMs,
          ),
        rateLimiter:
          deps.rateLimiter ??
          new TokenBucketRateLimiter(
            this.config.rateLimit.capacity,
            this.config.rateLimit.refillPerSecond,
          ),
        health: deps.healthMonitor ?? new DefaultHealthMonitor(),
      });
  }

  /** Subscribe to an orchestrator event; returns an unsubscribe function. */
  public on<K extends keyof AIEvents>(
    event: K,
    handler: (payload: AIEvents[K]) => void,
  ): () => void {
    return this.events.on(event, handler);
  }

  /** Register an AI provider. */
  public registerProvider(provider: AIProvider): void {
    this.providers.register(provider);
  }

  /** Register a model descriptor. */
  public registerModel(model: ModelDescriptor): void {
    this.models.register(model);
  }

  /** Execute a request end-to-end and return a standardized result. */
  public async execute(request: AIRequest): Promise<Result<ExecutionResult, AIError>> {
    const requestId = request.requestId ?? this.ids.next();
    const startedAt = this.clock.now();
    this.events.emit("request.received", { requestId });

    const prep = await this.prepare(request, requestId);
    if (isErr(prep)) {
      this.events.emit("execution.failed", { requestId, error: prep.error });
      return prep;
    }
    const { provider, model, prepared, context } = prep.value;
    const cacheKey = prepared.signature;

    const cached = this.cache?.get(cacheKey);
    if (cached !== undefined) {
      this.events.emit("cache.hit", { key: cacheKey });
      this.metrics.increment("ai.cache.hit");
      this.events.emit("response.received", {
        requestId,
        providerId: provider.id,
        modelId: model.id,
        totalTokens: cached.usage.totalTokens,
        cacheHit: true,
      });
      return ok(this.buildResult(cached, context, prepared, startedAt));
    }
    this.events.emit("cache.miss", { key: cacheKey });
    this.metrics.increment("ai.cache.miss");

    const executed = await this.executionPipeline.execute(provider, prepared);
    if (isErr(executed)) {
      this.events.emit("execution.failed", { requestId, error: executed.error });
      this.metrics.increment("ai.execution.failed");
      return executed;
    }

    const cost = this.costCalculator.cost(executed.value.usage, model.pricing);
    const response: AIResponse = { ...executed.value, cost };
    this.costs.track(provider.id, model.id, cost);
    this.events.emit("cost.tracked", { providerId: provider.id, cost });
    this.cache?.set(cacheKey, response);
    this.metrics.increment("ai.response");
    this.metrics.observe("ai.tokens.total", response.usage.totalTokens);
    this.events.emit("response.received", {
      requestId,
      providerId: provider.id,
      modelId: model.id,
      totalTokens: response.usage.totalTokens,
      cacheHit: false,
    });
    if (request.conversationId !== undefined) {
      this.conversations.append(request.conversationId, message("assistant", response.content));
    }
    this.logger?.debug("ai response", { requestId });
    return ok(this.buildResult(response, context, prepared, startedAt));
  }

  /** Prepare and stream a request (prepared; the stub emits a single chunk). */
  public async stream(
    request: AIRequest,
  ): Promise<Result<AsyncIterable<AIResponseChunk>, AIError>> {
    const requestId = request.requestId ?? this.ids.next();
    this.events.emit("request.received", { requestId });
    const prep = await this.prepare(request, requestId);
    if (isErr(prep)) {
      this.events.emit("execution.failed", { requestId, error: prep.error });
      return prep;
    }
    return ok(this.streamingManager.stream(prep.value.provider, prep.value.prepared));
  }

  private async prepare(request: AIRequest, requestId: string): Promise<Result<Prepared, AIError>> {
    const baseMessages: readonly Message[] =
      typeof request.input === "string" ? [message("user", request.input)] : [...request.input];

    const retrieved = await this.knowledgePipeline.retrieve(request.knowledgeQuery);
    if (isErr(retrieved)) {
      return retrieved;
    }
    this.events.emit("context.retrieved", { requestId, snippets: retrieved.value.length });

    const context = this.contextBuilder.build({
      snippets: retrieved.value,
      ...(request.variables !== undefined ? { variables: request.variables } : {}),
    });

    const built = await this.promptPipeline.build({
      context,
      baseMessages,
      ...(request.templateId !== undefined ? { templateId: request.templateId } : {}),
      ...(request.variables !== undefined ? { variables: request.variables } : {}),
    });
    if (isErr(built)) {
      return built;
    }
    this.events.emit("prompt.built", { requestId, messages: built.value.length });

    const providerSel = this.providerSelector.select(this.providers.list(), request.provider);
    if (isErr(providerSel)) {
      return providerSel;
    }
    const provider = providerSel.value;
    this.events.emit("provider.selected", { requestId, providerId: provider.id });

    const modelSel = this.modelSelector.select(this.models.list(), provider.id, request.model);
    if (isErr(modelSel)) {
      return modelSel;
    }
    const model = modelSel.value;
    this.events.emit("model.selected", { requestId, modelId: model.id });

    const params: GenerationParams = request.params ?? {};
    const signature = AIOrchestrator.signatureOf(provider.id, model.id, built.value, params);
    const prepared: PreparedRequest = {
      requestId,
      providerId: provider.id,
      modelId: model.id,
      messages: built.value,
      params,
      signature,
    };
    this.events.emit("request.prepared", { requestId, signature });
    return ok({ provider, model, prepared, context });
  }

  private static signatureOf(
    providerId: ProviderId,
    modelId: ModelId,
    messages: readonly Message[],
    params: GenerationParams,
  ): string {
    const payload: StructuredValue = {
      providerId,
      modelId,
      messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
      temperature: params.temperature ?? null,
      maxTokens: params.maxTokens ?? null,
      topP: params.topP ?? null,
      stop: params.stop !== undefined ? [...params.stop] : null,
    };
    return hashValue(payload);
  }

  private buildResult(
    response: AIResponse,
    context: Context,
    prepared: PreparedRequest,
    startedAt: Date,
  ): ExecutionResult {
    return {
      response,
      context,
      prepared,
      durationMs: this.clock.now().getTime() - startedAt.getTime(),
      attempts: 1,
    };
  }
}
