/**
 * {@link PromptEngine} — the façade that ties the engine together.
 *
 * It coordinates the template repository, validation, inheritance resolution,
 * partial aggregation (registry + dependencies), variable-schema validation,
 * rendering, caching, metrics, events, versioning and composition. Callers
 * (agents, the Knowledge Engine, the future AI Orchestrator) depend only on
 * this class; every collaborator is injected and addressed through its port.
 */
import { err, isErr, ok, type Logger, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import { DEFAULT_PROMPT_CONFIG, type PromptEngineConfig } from "./config.js";
import { createPromptMetadata, type PromptMetadataInput } from "./domain/metadata.js";
import { PromptTemplate } from "./domain/template.js";
import type { PromptComposition } from "./domain/composition.js";
import type { RenderedMessage, RenderedPrompt } from "./domain/message.js";
import type { PromptVersion } from "./domain/version.js";
import type { VariableSchema, VariableValues } from "./domain/variable.js";
import type { PromptChainDefinition } from "./domain/advanced.js";
import { PromptNotFoundError, PromptResolutionError, type PromptError } from "./errors.js";
import { PromptEventBus, type EventBus, type PromptEvents } from "./events.js";
import { ExportManager, type PromptBundle } from "./export-manager.js";
import { ImportManager } from "./import-manager.js";
import { InMemoryRenderCache } from "./cache/in-memory-cache.js";
import { NoopMetricsSink } from "./metrics/metrics.js";
import { DefaultLocaleResolver } from "./rendering/locale.js";
import { resolveInheritance } from "./rendering/inheritance.js";
import { NotImplementedChainRunner, NotImplementedRagAugmentor } from "./predisposition.js";
import type {
  LocaleResolver,
  MetricsSink,
  PromptChainRunner,
  PromptFormatter,
  RagAugmentor,
  RenderCache,
  SchemaValidator,
  TemplateRenderer,
  TemplateRepository,
} from "./interfaces.js";
import type { PromptRegistry } from "./registry.js";
import type { PromptValidator } from "./validator.js";
import { hashValue } from "./utils.js";
import {
  asTemplateId,
  type PromptFormat,
  type PromptRole,
  type TemplateFilter,
  type TemplateId,
} from "./types.js";

/** Collaborators required by {@link PromptEngine}. */
export interface PromptEngineDeps {
  readonly repository: TemplateRepository;
  readonly registry: PromptRegistry;
  readonly validator: PromptValidator;
  readonly renderer: TemplateRenderer;
  readonly schemaValidator: SchemaValidator;
  readonly formatter: PromptFormatter;
  readonly events?: EventBus<PromptEvents>;
  readonly cache?: RenderCache;
  readonly metrics?: MetricsSink;
  readonly logger?: Logger;
  readonly localeResolver?: LocaleResolver;
  readonly chainRunner?: PromptChainRunner;
  readonly ragAugmentor?: RagAugmentor;
  readonly config?: PromptEngineConfig;
}

/** Input for {@link PromptEngine.registerTemplate}. */
export interface RegisterTemplateInput {
  readonly id?: string;
  readonly name: string;
  readonly body: string;
  readonly format?: PromptFormat;
  readonly role?: PromptRole;
  readonly variables?: VariableSchema;
  readonly metadata?: PromptMetadataInput;
  readonly dependencies?: readonly string[];
  readonly extendsId?: string;
  readonly locales?: Readonly<Record<string, string>>;
}

/** Input for {@link PromptEngine.render}. */
export interface RenderInput {
  readonly templateId: string;
  readonly variables?: VariableValues;
  readonly locale?: string;
  readonly strict?: boolean;
}

/** The outcome of rendering a single template. */
export interface RenderResult {
  readonly templateId: TemplateId;
  readonly role: PromptRole;
  readonly content: string;
  readonly signature: string;
  readonly cacheHit: boolean;
}

/** The outcome of rendering a composition. */
export interface CompositionRenderResult {
  readonly prompt: RenderedPrompt;
  readonly formatted?: string;
}

export class PromptEngine {
  private readonly repository: TemplateRepository;
  private readonly registry: PromptRegistry;
  private readonly validator: PromptValidator;
  private readonly renderer: TemplateRenderer;
  private readonly schemaValidator: SchemaValidator;
  private readonly formatter: PromptFormatter;
  private readonly events: EventBus<PromptEvents>;
  private readonly cache: RenderCache | undefined;
  private readonly metrics: MetricsSink;
  private readonly logger: Logger | undefined;
  private readonly localeResolver: LocaleResolver;
  private readonly chainRunner: PromptChainRunner;
  private readonly ragAugmentor: RagAugmentor;
  private readonly config: PromptEngineConfig;
  private readonly exporter: ExportManager;
  private readonly importer: ImportManager;

  public constructor(deps: PromptEngineDeps) {
    this.repository = deps.repository;
    this.registry = deps.registry;
    this.validator = deps.validator;
    this.renderer = deps.renderer;
    this.schemaValidator = deps.schemaValidator;
    this.formatter = deps.formatter;
    this.events = deps.events ?? new PromptEventBus();
    this.metrics = deps.metrics ?? new NoopMetricsSink();
    this.logger = deps.logger;
    this.localeResolver = deps.localeResolver ?? new DefaultLocaleResolver();
    this.chainRunner = deps.chainRunner ?? new NotImplementedChainRunner();
    this.ragAugmentor = deps.ragAugmentor ?? new NotImplementedRagAugmentor();
    this.config = deps.config ?? DEFAULT_PROMPT_CONFIG;
    this.cache =
      deps.cache ??
      (this.config.cache.enabled
        ? new InMemoryRenderCache(this.config.cache.maxEntries)
        : undefined);
    this.exporter = new ExportManager(this.repository);
    this.importer = new ImportManager(this.repository, this.validator, this.events);
  }

  /** Subscribe to a prompt event; returns an unsubscribe function. */
  public on<K extends keyof PromptEvents>(
    event: K,
    handler: (payload: PromptEvents[K]) => void,
  ): () => void {
    return this.events.on(event, handler);
  }

  /** Register (or update) a template. */
  public async registerTemplate(
    input: RegisterTemplateInput,
  ): Promise<Result<PromptTemplate, PromptError>> {
    const now = new Date().toISOString();
    const id = input.id !== undefined && input.id.length > 0 ? input.id : hashValue(input.body);
    const metadata = createPromptMetadata(input.metadata ?? {}, now, this.config.defaultLanguage);
    const template = PromptTemplate.create({
      id: asTemplateId(id),
      name: input.name,
      body: input.body,
      format: input.format ?? this.config.defaultFormat,
      variables: input.variables ?? [],
      metadata,
      dependencies: (input.dependencies ?? []).map(asTemplateId),
      locales: input.locales ?? {},
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.extendsId !== undefined ? { extendsId: asTemplateId(input.extendsId) } : {}),
    });
    return this.persist(template, now);
  }

  /** Retrieve a template by id. */
  public getTemplate(id: string): Promise<Result<PromptTemplate, PromptError>> {
    return this.repository.get(asTemplateId(id));
  }

  /** List templates, optionally filtered. */
  public listTemplates(
    filter?: TemplateFilter,
  ): Promise<Result<readonly PromptTemplate[], PromptError>> {
    return this.repository.list(filter);
  }

  /** Retrieve the version history of a template. */
  public getVersions(id: string): Promise<Result<readonly PromptVersion[], PromptError>> {
    return this.repository.versions(asTemplateId(id));
  }

  /** Remove a template. */
  public async removeTemplate(id: string): Promise<Result<void, PromptError>> {
    const templateId = asTemplateId(id);
    const removed = await this.repository.remove(templateId);
    if (isErr(removed)) {
      return removed;
    }
    this.events.emit("template.removed", { templateId });
    return ok(undefined);
  }

  /** Render a single template into text. */
  public async render(input: RenderInput): Promise<Result<RenderResult, PromptError>> {
    const templateId = asTemplateId(input.templateId);
    const fetched = await this.repository.get(templateId);
    if (isErr(fetched)) {
      return fetched;
    }
    const template = fetched.value;

    const available = Object.keys(template.locales);
    const requested = input.locale ?? this.config.defaultLanguage;
    const locale = this.localeResolver.resolve(available, requested, template.metadata.language);

    const chain = await this.loadChain(template);
    if (isErr(chain)) {
      this.events.emit("prompt.error", { error: chain.error });
      return chain;
    }
    const body = resolveInheritance(template, (id) => chain.value.get(id), locale);
    if (isErr(body)) {
      this.events.emit("prompt.error", { error: body.error });
      return body;
    }

    const partials = await this.collectPartials(template, locale);
    if (isErr(partials)) {
      this.events.emit("prompt.error", { error: partials.error });
      return partials;
    }

    const validatedVars = this.schemaValidator.validate(template.variables, input.variables ?? {});
    if (isErr(validatedVars)) {
      this.events.emit("prompt.error", { error: validatedVars.error });
      return validatedVars;
    }

    const strict = input.strict ?? this.config.strictRendering;
    const cacheKey = this.cacheKey(template.signature, locale, validatedVars.value, strict);

    const cached = this.cache?.get(cacheKey);
    if (cached !== undefined) {
      this.metrics.increment("prompt.cache.hit");
      this.events.emit("cache.hit", { key: cacheKey });
      return ok(this.result(template, cached, true));
    }
    this.metrics.increment("prompt.cache.miss");
    this.events.emit("cache.miss", { key: cacheKey });

    const rendered = this.renderer.render(body.value, {
      variables: validatedVars.value,
      partials: partials.value,
      strict,
    });
    if (isErr(rendered)) {
      this.events.emit("prompt.error", { error: rendered.error });
      return rendered;
    }

    this.cache?.set(cacheKey, rendered.value);
    this.metrics.increment("prompt.rendered");
    this.metrics.observe("prompt.render.length", rendered.value.length);
    this.events.emit("prompt.rendered", {
      templateId: template.id,
      signature: template.signature,
      cacheHit: false,
    });
    this.logger?.debug("prompt rendered", { id: template.id });
    return ok(this.result(template, rendered.value, false));
  }

  /** Render a multi-role composition into a {@link RenderedPrompt}. */
  public async renderComposition(
    composition: PromptComposition,
    variables?: VariableValues,
    options?: { readonly locale?: string; readonly format?: PromptFormat },
  ): Promise<Result<CompositionRenderResult, PromptError>> {
    const messages: RenderedMessage[] = [];
    for (const part of composition.parts) {
      const merged: VariableValues = { ...(variables ?? {}), ...(part.variables ?? {}) };
      const rendered = await this.render({
        templateId: part.templateId,
        variables: merged,
        ...(options?.locale !== undefined ? { locale: options.locale } : {}),
      });
      if (isErr(rendered)) {
        return rendered;
      }
      messages.push({ role: part.role, content: rendered.value.content });
    }
    const prompt: RenderedPrompt = { messages };

    if (options?.format === undefined) {
      this.events.emit("composition.rendered", {
        compositionId: composition.id,
        format: this.config.defaultFormat,
      });
      return ok({ prompt });
    }
    const formatted = this.formatter.format(prompt, options.format);
    if (isErr(formatted)) {
      this.events.emit("prompt.error", { error: formatted.error });
      return formatted;
    }
    this.events.emit("composition.rendered", {
      compositionId: composition.id,
      format: options.format,
    });
    return ok({ prompt, formatted: formatted.value });
  }

  /** Export templates into a portable bundle. */
  public exportBundle(filter?: TemplateFilter): Promise<Result<PromptBundle, PromptError>> {
    return this.exporter.export(filter).then((result) => {
      if (!isErr(result)) {
        this.events.emit("export.completed", { exported: result.value.templates.length });
      }
      return result;
    });
  }

  /** Import templates from a bundle. */
  public importBundle(
    bundle: PromptBundle,
  ): Promise<Result<readonly PromptTemplate[], PromptError>> {
    return this.importer.import(bundle);
  }

  /** Execute a prompt chain (prepared; requires a chain runner). */
  public runChain(
    chain: PromptChainDefinition,
    values: VariableValues,
  ): Promise<Result<RenderedPrompt, PromptError>> {
    return this.chainRunner.run(chain, values);
  }

  /** Augment variables with retrieved context for RAG (prepared). */
  public augmentWithRag(
    query: string,
    values: VariableValues,
  ): Promise<Result<VariableValues, PromptError>> {
    return this.ragAugmentor.augment(query, values);
  }

  private async persist(
    template: PromptTemplate,
    now: string,
  ): Promise<Result<PromptTemplate, PromptError>> {
    const existing = await this.repository.get(template.id);
    let toSave = template;
    let previousVersion = 0;
    if (!isErr(existing)) {
      previousVersion = existing.value.version;
      const metadata = {
        ...template.metadata,
        createdAt: existing.value.metadata.createdAt,
        updatedAt: now,
      };
      toSave = template.withVersion(previousVersion + 1, metadata);
    }

    const validated = this.validator.validate(toSave);
    if (isErr(validated)) {
      this.events.emit("prompt.error", { error: validated.error });
      return validated;
    }
    const saved = await this.repository.save(toSave);
    if (isErr(saved)) {
      this.events.emit("prompt.error", { error: saved.error });
      return saved;
    }
    if (previousVersion > 0) {
      this.events.emit("template.updated", { templateId: toSave.id, previousVersion });
    } else {
      this.events.emit("template.registered", {
        templateId: toSave.id,
        version: toSave.version,
      });
    }
    return ok(saved.value);
  }

  private async loadChain(
    template: PromptTemplate,
  ): Promise<Result<ReadonlyMap<TemplateId, PromptTemplate>, PromptError>> {
    const map = new Map<TemplateId, PromptTemplate>();
    map.set(template.id, template);
    let current = template;
    const guard = new Set<string>([template.id]);
    while (current.extendsId !== undefined) {
      const parentId = current.extendsId;
      if (guard.has(parentId)) {
        return err(new PromptResolutionError(`Inheritance cycle detected at "${parentId}".`));
      }
      const parent = await this.repository.get(parentId);
      if (isErr(parent)) {
        return err(new PromptResolutionError(`Parent template "${parentId}" not found.`));
      }
      map.set(parentId, parent.value);
      guard.add(parentId);
      current = parent.value;
    }
    return ok(map);
  }

  private async collectPartials(
    template: PromptTemplate,
    locale: string,
  ): Promise<Result<Readonly<Record<string, string>>, PromptError>> {
    const partials: Record<string, string> = { ...this.registry.partials() };
    for (const dependencyId of template.dependencies) {
      const dependency = await this.repository.get(dependencyId);
      if (isErr(dependency)) {
        return err(new PromptNotFoundError(`Dependency template "${dependencyId}" not found.`));
      }
      const body = dependency.value.bodyFor(locale);
      partials[dependency.value.id] = body;
      partials[dependency.value.name] = body;
    }
    return ok(partials);
  }

  private cacheKey(
    signature: string,
    locale: string,
    values: VariableValues,
    strict: boolean,
  ): string {
    const payload: StructuredValue = {
      signature,
      locale,
      strict,
      values: { ...values },
    };
    return hashValue(payload);
  }

  private result(template: PromptTemplate, content: string, cacheHit: boolean): RenderResult {
    return {
      templateId: template.id,
      role: template.role ?? "user",
      content,
      signature: template.signature,
      cacheHit,
    };
  }
}
