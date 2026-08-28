// -----------------------------------------------------------------------------
// Shared engine wiring for the generator adapters.
//
// This is the single place that opts into the REAL, environment-based AI
// Orchestrator (unlike the generator packages' standalone entry points, which
// default to a network-free stub). When OPENAI_API_KEY is set the orchestrator
// uses the OpenAI provider; otherwise it uses the local StubProvider.
// -----------------------------------------------------------------------------
import { ServiceContainer } from "@telemax/core";
import { registerAIOrchestratorFromEnv, type AIOrchestrator } from "@telemax/ai";

export interface OrchestratorHandle {
  readonly orchestrator: AIOrchestrator;
  readonly providerId: string;
}

/** Build an AI Orchestrator wired from the process environment. */
export function buildOrchestrator(): OrchestratorHandle {
  const registered = registerAIOrchestratorFromEnv(new ServiceContainer());
  return { orchestrator: registered.orchestrator, providerId: registered.providerId };
}
