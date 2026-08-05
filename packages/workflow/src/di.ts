/**
 * Dependency-injection wiring. {@link registerWorkflowEngine} composes a default
 * {@link WorkflowEngine} and registers its key collaborators behind Core tokens.
 */
import { createToken, type ServiceContainer } from "@telemax/core";
import {
  resolveWorkflowConfig,
  type WorkflowEngineConfig,
  type WorkflowEngineConfigInput,
} from "./config.js";
import { WorkflowEventBus, type EventBus, type WorkflowEvents } from "./events.js";
import { StepHandlerRegistry } from "./handlers/registry.js";
import { WorkflowEngine } from "./engine.js";

export const WORKFLOW_CONFIG = createToken<WorkflowEngineConfig>("workflow.config");
export const WORKFLOW_EVENTS = createToken<EventBus<WorkflowEvents>>("workflow.events");
export const WORKFLOW_HANDLERS = createToken<StepHandlerRegistry>("workflow.handlers");
export const WORKFLOW_ENGINE = createToken<WorkflowEngine>("workflow.engine");

/** Build and register a default {@link WorkflowEngine} into `container`. */
export function registerWorkflowEngine(
  container: ServiceContainer,
  input?: WorkflowEngineConfigInput,
): WorkflowEngine {
  const config = resolveWorkflowConfig(input);
  const events = new WorkflowEventBus();
  const handlers = new StepHandlerRegistry();
  const engine = new WorkflowEngine({ config, events, handlers });

  container.register(WORKFLOW_CONFIG, () => config);
  container.register(WORKFLOW_EVENTS, () => events);
  container.register(WORKFLOW_HANDLERS, () => engine.handlers);
  container.register(WORKFLOW_ENGINE, () => engine);

  return engine;
}
