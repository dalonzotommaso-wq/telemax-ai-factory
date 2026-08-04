/**
 * Dependency-injection wiring. {@link registerPromptEngine} composes the default
 * engine and registers every collaborator behind a Core {@link Token}.
 */
import { createToken, type ServiceContainer } from "@telemax/core";
import {
  resolvePromptConfig,
  type PromptEngineConfig,
  type PromptEngineConfigInput,
} from "./config.js";
import { PromptEventBus, type EventBus, type PromptEvents } from "./events.js";
import { InMemoryRenderCache } from "./cache/in-memory-cache.js";
import { NoopMetricsSink } from "./metrics/metrics.js";
import { DefaultPromptFormatter } from "./rendering/formatters.js";
import { DefaultTemplateRenderer } from "./rendering/default-renderer.js";
import { DefaultSchemaValidator } from "./schema/schema-validator.js";
import { InMemoryTemplateRepository } from "./repository/in-memory-template-repository.js";
import { PromptRegistry } from "./registry.js";
import { PromptValidator } from "./validator.js";
import { PromptEngine } from "./service.js";
import type {
  PromptFormatter,
  RenderCache,
  SchemaValidator,
  TemplateRenderer,
  TemplateRepository,
} from "./interfaces.js";

export const PROMPT_CONFIG = createToken<PromptEngineConfig>("prompt.config");
export const PROMPT_EVENTS = createToken<EventBus<PromptEvents>>("prompt.events");
export const PROMPT_REPOSITORY = createToken<TemplateRepository>("prompt.repository");
export const PROMPT_REGISTRY = createToken<PromptRegistry>("prompt.registry");
export const PROMPT_VALIDATOR = createToken<PromptValidator>("prompt.validator");
export const PROMPT_RENDERER = createToken<TemplateRenderer>("prompt.renderer");
export const PROMPT_SCHEMA_VALIDATOR = createToken<SchemaValidator>("prompt.schemaValidator");
export const PROMPT_FORMATTER = createToken<PromptFormatter>("prompt.formatter");
export const PROMPT_CACHE = createToken<RenderCache>("prompt.cache");
export const PROMPT_ENGINE = createToken<PromptEngine>("prompt.engine");

/**
 * Build and register the default Prompt Engine into `container`,
 * returning the composed {@link PromptEngine}.
 */
export function registerPromptEngine(
  container: ServiceContainer,
  input?: PromptEngineConfigInput,
): PromptEngine {
  const config = resolvePromptConfig(input);
  const events = new PromptEventBus();
  const repository = new InMemoryTemplateRepository({ enableVersioning: config.enableVersioning });
  const registry = new PromptRegistry();
  const validator = new PromptValidator();
  const renderer = new DefaultTemplateRenderer();
  const schemaValidator = new DefaultSchemaValidator();
  const formatter = new DefaultPromptFormatter();
  const metrics = new NoopMetricsSink();
  const cache: RenderCache | undefined = config.cache.enabled
    ? new InMemoryRenderCache(config.cache.maxEntries)
    : undefined;

  const engine = new PromptEngine({
    repository,
    registry,
    validator,
    renderer,
    schemaValidator,
    formatter,
    events,
    metrics,
    config,
    ...(cache !== undefined ? { cache } : {}),
  });

  container.register(PROMPT_CONFIG, () => config);
  container.register(PROMPT_EVENTS, () => events);
  container.register(PROMPT_REPOSITORY, () => repository);
  container.register(PROMPT_REGISTRY, () => registry);
  container.register(PROMPT_VALIDATOR, () => validator);
  container.register(PROMPT_RENDERER, () => renderer);
  container.register(PROMPT_SCHEMA_VALIDATOR, () => schemaValidator);
  container.register(PROMPT_FORMATTER, () => formatter);
  if (cache !== undefined) {
    container.register(PROMPT_CACHE, () => cache);
  }
  container.register(PROMPT_ENGINE, () => engine);

  return engine;
}
