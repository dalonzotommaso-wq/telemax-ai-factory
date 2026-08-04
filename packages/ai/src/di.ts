/**
 * Dependency-injection wiring. {@link registerAIOrchestrator} composes a default
 * orchestrator and registers its key collaborators behind Core tokens. Providers
 * and models are registered by the caller (this package ships none but the stub).
 */
import { createToken, type ServiceContainer } from "@telemax/core";
import {
  resolveOrchestratorConfig,
  type OrchestratorConfig,
  type OrchestratorConfigInput,
} from "./config.js";
import { AIEventBus, type AIEvents, type EventBus } from "./events.js";
import { CostTracker } from "./cost/cost-tracker.js";
import { AIOrchestrator } from "./orchestrator.js";
import { ModelRegistry } from "./providers/model-registry.js";
import { AIProviderRegistry } from "./providers/provider-registry.js";
import type { CostSink } from "./interfaces.js";

export const AI_CONFIG = createToken<OrchestratorConfig>("ai.config");
export const AI_EVENTS = createToken<EventBus<AIEvents>>("ai.events");
export const AI_PROVIDER_REGISTRY = createToken<AIProviderRegistry>("ai.providerRegistry");
export const AI_MODEL_REGISTRY = createToken<ModelRegistry>("ai.modelRegistry");
export const AI_COST_TRACKER = createToken<CostSink>("ai.costTracker");
export const AI_ORCHESTRATOR = createToken<AIOrchestrator>("ai.orchestrator");

/** Build and register a default {@link AIOrchestrator} into `container`. */
export function registerAIOrchestrator(
  container: ServiceContainer,
  input?: OrchestratorConfigInput,
): AIOrchestrator {
  const config = resolveOrchestratorConfig(input);
  const events = new AIEventBus();
  const providerRegistry = new AIProviderRegistry();
  const modelRegistry = new ModelRegistry();
  const costTracker = new CostTracker();
  const orchestrator = new AIOrchestrator({
    config,
    events,
    providerRegistry,
    modelRegistry,
    costTracker,
  });

  container.register(AI_CONFIG, () => config);
  container.register(AI_EVENTS, () => events);
  container.register(AI_PROVIDER_REGISTRY, () => providerRegistry);
  container.register(AI_MODEL_REGISTRY, () => modelRegistry);
  container.register(AI_COST_TRACKER, () => costTracker);
  container.register(AI_ORCHESTRATOR, () => orchestrator);

  return orchestrator;
}
