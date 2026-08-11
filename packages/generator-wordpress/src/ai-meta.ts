/**
 * AI-assisted meta description: the first real AI step of the WordPress pipeline.
 *
 * - {@link resilientAiRunner} wraps the shipped `aiRunner` (which drives the AI
 *   Orchestrator) so that a provider/AI error never fails the generation: on
 *   error it yields an empty string, letting the pipeline fall back.
 * - {@link metaFinalizeTransform} takes the AI output and the deterministic
 *   Prompt-Engine output and decides the final meta description: it uses the AI
 *   text when usable, otherwise the deterministic fallback (stub echo, empty or
 *   error). This keeps behaviour identical to before whenever real AI is absent.
 *
 * No new AI logic lives here: the actual model call is delegated to the existing
 * AI Orchestrator via the existing `aiRunner`.
 */
import { isErr, ok } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import type { AIOrchestrator } from "@telemax/ai";
import { aiRunner, type AIRunner, type GeneratorTransform } from "@telemax/generator-engine";

/** Marker prefix produced by the local StubProvider (no real AI available). */
export const STUB_MARKER = "[stub:";

/** Variable names exchanged between the AI step and the finalize transform. */
export const AI_META_VAR = "aiMeta";
export const META_FALLBACK_VAR = "metaFallback";

function asString(value: StructuredValue | undefined): string {
  if (value === undefined || value === null) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** Normalise an AI meta description: single line, unquoted, trimmed, capped. */
export function sanitizeMeta(raw: string, maxLength = 160): string {
  const oneLine = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
  return oneLine.length > maxLength ? `${oneLine.slice(0, maxLength - 1).trimEnd()}…` : oneLine;
}

/** True when the AI output is unusable and the deterministic fallback must win. */
export function isFallback(aiOutput: string): boolean {
  const trimmed = aiOutput.trim();
  return trimmed.length === 0 || trimmed.startsWith(STUB_MARKER);
}

/**
 * An {@link AIRunner} that delegates to the existing `aiRunner`/Orchestrator and
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

/**
 * Finalize the meta description: AI text when usable, deterministic fallback
 * (the Prompt-Engine output) otherwise. Reads {@link AI_META_VAR} and
 * {@link META_FALLBACK_VAR} from the generation context.
 */
export function metaFinalizeTransform(): GeneratorTransform {
  return (_input, context) => {
    const ai = asString(context.variables[AI_META_VAR]);
    const fallback = asString(context.variables[META_FALLBACK_VAR]);
    const value = isFallback(ai) ? fallback : sanitizeMeta(ai);
    return Promise.resolve(ok(value as StructuredValue));
  };
}
