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
import { conventionsTransform, getConventions } from "./knowledge.js";
import { contentPlanTransform, CONTENT_PLAN_FIELD_TRANSFORMS } from "./content-plan.js";
import { buildPrepareWorkflow } from "./workflow.js";
import { renderContentPlanInstruction, type PromptEngineInstance } from "./prompts.js";
import { WORDPRESS_NEWS_GENERATOR, buildWordPressNewsDefinition } from "./generator.js";
import type { ResolvedWordPressConfig } from "./types.js";

/** Engines the WordPress News generator coordinates. */
export interface WordPressNewsDeps {
  readonly generator: GeneratorEngine;
  readonly workflow: WorkflowEngine;
  readonly prompt: PromptEngineInstance;
  readonly knowledge: KnowledgeService;
}

/** Register the workflow, transforms, coordination runners and generator. */
export async function registerWordPressNews(
  deps: WordPressNewsDeps,
  config: ResolvedWordPressConfig,
): Promise<Result<{ readonly generatorId: string }, GeneratorError>> {
  deps.workflow.registerWorkflow(buildPrepareWorkflow(config));
  deps.generator.registerTransform("wp-conventions", conventionsTransform(deps.knowledge));
  deps.generator.registerTransform("wp-content-plan", contentPlanTransform(config));
  for (const [id, transform] of Object.entries(CONTENT_PLAN_FIELD_TRANSFORMS)) {
    deps.generator.registerTransform(id, transform);
  }
  deps.generator.useWorkflow(deps.workflow);
  deps.generator.usePrompt(deps.prompt);

  // Render the Content Plan instruction once (Prompt Engine + Knowledge) and bake
  // it into the pipeline's AI step input. The Orchestrator built from env has no
  // prompt engine, so the instruction is rendered here rather than in the step.
  const conventions = await getConventions(deps.knowledge);
  const aiContentPlanPrompt = await renderContentPlanInstruction(deps.prompt, {
    siteName: config.siteName,
    siteDescription: config.siteDescription,
    conventions,
  });

  const registered = deps.generator.registerGenerator(
    buildWordPressNewsDefinition(config, aiContentPlanPrompt),
  );
  if (isErr(registered)) {
    return registered;
  }
  return ok({ generatorId: WORDPRESS_NEWS_GENERATOR });
}
