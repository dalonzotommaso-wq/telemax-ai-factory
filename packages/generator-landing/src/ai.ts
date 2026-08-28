/**
 * AI step wiring. The actual model call is delegated to the existing AI
 * Orchestrator via the Generator Engine's shipped `aiRunner`; no new AI logic
 * lives here.
 *
 * {@link resilientAiRunner} wraps `aiRunner` so that a provider/AI error never
 * fails the generation: on error it yields an empty string, which the Content
 * Plan transform treats as "use the deterministic fallback".
 */
import { isErr, ok } from "@telemax/core";
import type { AIOrchestrator } from "@telemax/ai";
import { aiRunner, type AIRunner } from "@telemax/generator-engine";

/** Marker prefix produced by the local StubProvider (no real AI available). */
export const STUB_MARKER = "[stub:";

/** True when the AI output is unusable and the deterministic fallback must win. */
export function isFallback(aiOutput: string): boolean {
  const trimmed = aiOutput.trim();
  return trimmed.length === 0 || trimmed.startsWith(STUB_MARKER);
}

/**
 * An {@link AIRunner} that delegates to the shipped `aiRunner`/Orchestrator and
 * degrades to an empty string on error, so the pipeline never fails on AI.
 */
export function resilientAiRunner(orchestrator: AIOrchestrator): AIRunner {
  const base = aiRunner(orchestrator);
  return {
    async run(request) {
      const result = await base.run(request);
      return isErr(result) ? ok("") : result;
    },
  };
}
