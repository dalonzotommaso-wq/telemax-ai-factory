/**
 * Dependency-injection wiring.
 *
 * {@link registerKnowledge} composes the default engine (loaders, repository,
 * validator, index, events, service) and registers each behind a Core
 * {@link Token} in a {@link ServiceContainer}. Instances are built once and
 * shared, demonstrating integration with `@telemax/core` DI.
 */
import { createToken, type ServiceContainer } from "@telemax/core";
import { resolveConfig, type KnowledgeConfig, type KnowledgeConfigInput } from "./config.js";
import { KnowledgeEventBus, type EventBus, type KnowledgeEvents } from "./events.js";
import { ImageLoader, PdfLoader } from "./loaders/binary-loaders.js";
import { JsonLoader } from "./loaders/json-loader.js";
import { MarkdownLoader } from "./loaders/markdown-loader.js";
import { YamlLoader } from "./loaders/yaml-loader.js";
import { InMemoryFullTextIndex } from "./indexing/in-memory-fulltext-index.js";
import { InMemoryKnowledgeRepository } from "./repository/in-memory-repository.js";
import { KnowledgeRegistry } from "./registry.js";
import { KnowledgeService } from "./service.js";
import { KnowledgeValidator } from "./validator.js";
import type { KnowledgeIndex, KnowledgeRepository } from "./interfaces.js";

export const KNOWLEDGE_CONFIG = createToken<KnowledgeConfig>("knowledge.config");
export const KNOWLEDGE_EVENTS = createToken<EventBus<KnowledgeEvents>>("knowledge.events");
export const KNOWLEDGE_REGISTRY = createToken<KnowledgeRegistry>("knowledge.registry");
export const KNOWLEDGE_REPOSITORY = createToken<KnowledgeRepository>("knowledge.repository");
export const KNOWLEDGE_VALIDATOR = createToken<KnowledgeValidator>("knowledge.validator");
export const KNOWLEDGE_INDEX = createToken<KnowledgeIndex>("knowledge.index");
export const KNOWLEDGE_SERVICE = createToken<KnowledgeService>("knowledge.service");

/**
 * Build and register the default knowledge engine into `container`,
 * returning the composed {@link KnowledgeService}.
 */
export function registerKnowledge(
  container: ServiceContainer,
  input?: KnowledgeConfigInput,
): KnowledgeService {
  const config = resolveConfig(input);
  const events = new KnowledgeEventBus();

  const registry = new KnowledgeRegistry();
  const loaderDeps = { defaultLanguage: config.defaultLanguage };
  registry.registerLoader(new MarkdownLoader(loaderDeps));
  registry.registerLoader(new JsonLoader(loaderDeps));
  registry.registerLoader(new YamlLoader(loaderDeps));
  registry.registerLoader(new PdfLoader());
  registry.registerLoader(new ImageLoader());

  const repository = new InMemoryKnowledgeRepository({
    enableVersioning: config.enableVersioning,
  });
  const validator = new KnowledgeValidator({ maxContentBytes: config.maxContentBytes });
  const index: KnowledgeIndex | undefined = config.indexing.fullText
    ? new InMemoryFullTextIndex()
    : undefined;

  const service = new KnowledgeService({
    repository,
    registry,
    validator,
    events,
    config,
    ...(index !== undefined ? { index } : {}),
  });

  container.register(KNOWLEDGE_CONFIG, () => config);
  container.register(KNOWLEDGE_EVENTS, () => events);
  container.register(KNOWLEDGE_REGISTRY, () => registry);
  container.register(KNOWLEDGE_REPOSITORY, () => repository);
  container.register(KNOWLEDGE_VALIDATOR, () => validator);
  if (index !== undefined) {
    container.register(KNOWLEDGE_INDEX, () => index);
  }
  container.register(KNOWLEDGE_SERVICE, () => service);

  return service;
}
