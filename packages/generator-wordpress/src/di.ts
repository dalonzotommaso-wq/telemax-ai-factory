/**
 * Wiring helper: register the WordPress News generator and its coordinated
 * engines (Workflow, Prompt, Knowledge) onto a Generator Engine. The Prompt
 * meta template must already be registered on the Prompt engine (see
 * {@link buildPromptEngine}).
 */
import { isErr, ok, type Result } from "@telemax/core";
import type { GeneratorEngine, GeneratorError } from "@telemax/generator-engine";
import type { KnowledgeService } from "@telemax/knowledge";
import type { WorkflowEngine } from "@telemax/workflow";
import { conventionsTransform } from "./knowledge.js";
import { buildPrepareWorkflow } from "./workflow.js";
import type { PromptEngineInstance } from "./prompts.js";
import { WORDPRESS_NEWS_GENERATOR, buildWordPressNewsDefinition } from "./generator.js";
import type { ResolvedWordPressConfig } from "./types.js";

/** Engines the WordPress News generator coordinates. */
export interface WordPressNewsDeps {
  readonly generator: GeneratorEngine;
  readonly workflow: WorkflowEngine;
  readonly prompt: PromptEngineInstance;
  readonly knowledge: KnowledgeService;
}

/** Register the workflow, transform, coordination runners and generator. */
export function registerWordPressNews(
  deps: WordPressNewsDeps,
  config: ResolvedWordPressConfig,
): Result<{ readonly generatorId: string }, GeneratorError> {
  deps.workflow.registerWorkflow(buildPrepareWorkflow(config));
  deps.generator.registerTransform("wp-conventions", conventionsTransform(deps.knowledge));
  deps.generator.useWorkflow(deps.workflow);
  deps.generator.usePrompt(deps.prompt);
  const registered = deps.generator.registerGenerator(buildWordPressNewsDefinition(config));
  if (isErr(registered)) {
    return registered;
  }
  return ok({ generatorId: WORDPRESS_NEWS_GENERATOR });
}
