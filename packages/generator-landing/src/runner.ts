/**
 * High-level entry point: validate, wire every engine, register the generator and
 * produce the Landing Page project artifacts.
 */
import { GeneratorEngine } from "@telemax/generator-engine";
import type { AIRunner, GeneratorError, GeneratorResult } from "@telemax/generator-engine";
import { WorkflowEngine } from "@telemax/workflow";
import { ServiceContainer, isErr, type Result } from "@telemax/core";
import { registerAIOrchestratorFromEnv } from "@telemax/ai";
import { resolveLandingPageConfig } from "./config.js";
import { registerLandingPage } from "./di.js";
import { resilientAiRunner } from "./ai.js";
import { seedKnowledge } from "./knowledge.js";
import { buildPromptEngine } from "./prompts.js";
import { assembleVariables } from "./assemble.js";
import { validateProject } from "./validation-engine.js";
import { LANDING_PAGE_GENERATOR } from "./generator.js";
import type { LandingPageError } from "./errors.js";
import type { LandingPageConfig } from "./types.js";

/** Options for {@link generateLandingPage}. */
export interface GenerateOptions {
  readonly year?: number;
  readonly generatedAt?: string;
  /**
   * AI runner to drive the pipeline's AI step. Defaults to a deterministic,
   * network-free StubProvider-backed runner. Tests inject their own; the app
   * layer injects a runner wired to the real (env-based) Orchestrator.
   */
  readonly ai?: AIRunner;
}

/** Validate the config, wire the engines and generate the project artifacts. */
export async function generateLandingPage(
  input: LandingPageConfig,
  options: GenerateOptions = {},
): Promise<Result<GeneratorResult, LandingPageError | GeneratorError>> {
  const validation = validateProject(input);
  if (isErr(validation)) {
    return validation;
  }
  const config = resolveLandingPageConfig(input);

  // Default to a stub-only Orchestrator (env forced empty -> no network).
  const ai =
    options.ai ??
    resilientAiRunner(
      registerAIOrchestratorFromEnv(new ServiceContainer(), { env: {} }).orchestrator,
    );

  const generator = new GeneratorEngine({ ai });
  const workflow = new WorkflowEngine();
  const prompt = await buildPromptEngine();
  const knowledge = await seedKnowledge();

  const registered = await registerLandingPage({ generator, workflow, prompt, knowledge }, config);
  if (isErr(registered)) {
    return registered;
  }

  const year = options.year ?? new Date().getFullYear();
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  return generator.generate(LANDING_PAGE_GENERATOR, assembleVariables(config, year, generatedAt));
}
