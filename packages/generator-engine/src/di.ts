/**
 * Dependency-injection wiring. {@link registerGeneratorEngine} composes a default
 * {@link GeneratorEngine} and registers its key collaborators behind Core tokens.
 */
import { createToken, type ServiceContainer } from "@telemax/core";
import {
  resolveGeneratorConfig,
  type GeneratorEngineConfig,
  type GeneratorEngineConfigInput,
} from "./config.js";
import { GeneratorEventBus, type EventBus, type GeneratorEvents } from "./events.js";
import type { GeneratorTemplateRepository } from "./template/repository.js";
import type { GeneratorTransformRegistry } from "./transforms/registry.js";
import { GeneratorEngine } from "./engine.js";

export const GENERATOR_CONFIG = createToken<GeneratorEngineConfig>("generator.config");
export const GENERATOR_EVENTS = createToken<EventBus<GeneratorEvents>>("generator.events");
export const GENERATOR_TEMPLATES = createToken<GeneratorTemplateRepository>("generator.templates");
export const GENERATOR_TRANSFORMS = createToken<GeneratorTransformRegistry>("generator.transforms");
export const GENERATOR_ENGINE = createToken<GeneratorEngine>("generator.engine");

/** Build and register a default {@link GeneratorEngine} into `container`. */
export function registerGeneratorEngine(
  container: ServiceContainer,
  input?: GeneratorEngineConfigInput,
): GeneratorEngine {
  const config = resolveGeneratorConfig(input);
  const events = new GeneratorEventBus();
  const engine = new GeneratorEngine({ config, events });

  container.register(GENERATOR_CONFIG, () => config);
  container.register(GENERATOR_EVENTS, () => events);
  container.register(GENERATOR_TEMPLATES, () => engine.templates);
  container.register(GENERATOR_TRANSFORMS, () => engine.transforms);
  container.register(GENERATOR_ENGINE, () => engine);

  return engine;
}
