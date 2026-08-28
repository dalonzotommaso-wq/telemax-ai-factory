// -----------------------------------------------------------------------------
// WordPressAdapter — wraps `@telemax/generator-wordpress`.
//
// This is the exact wiring that previously lived inline in GenerationService,
// moved behind the GeneratorAdapter contract.
// -----------------------------------------------------------------------------
import { isErr } from "@telemax/core";
import { GeneratorEngine } from "@telemax/generator-engine";
import { WorkflowEngine } from "@telemax/workflow";
import {
  assembleVariables,
  buildPromptEngine,
  registerWordPressNews,
  resilientAiRunner,
  resolveWordPressConfig,
  seedKnowledge,
  validateProject,
  writeProject,
  WORDPRESS_NEWS_GENERATOR,
  type WordPressSiteConfig,
} from "@telemax/generator-wordpress";
import type { Project } from "../../domain.js";
import { buildOrchestrator } from "./engine.js";
import {
  generatorIdOf,
  projectTypeOf,
  type ContentPlanObservability,
  type GeneratorAdapter,
  type GeneratorRunContext,
  type GeneratorRunResult,
  type ProjectManifest,
} from "./adapter.js";

function readContentPlan(variables: Readonly<Record<string, unknown>>): ContentPlanObservability {
  const envelope = variables["contentPlanEnvelope"] as
    | { readonly source?: string; readonly validation?: string }
    | undefined;
  return {
    source: envelope?.source === "ai" ? "generated" : "fallback",
    validation: envelope?.validation === "failed" ? "failed" : "passed",
  };
}

export const wordpressAdapter: GeneratorAdapter = {
  id: WORDPRESS_NEWS_GENERATOR,

  matches(project: Project, manifest: ProjectManifest): boolean {
    return (
      generatorIdOf(project, manifest).includes("generator-wordpress") ||
      projectTypeOf(project, manifest) === "wordpress-news"
    );
  },

  async run(ctx: GeneratorRunContext): Promise<GeneratorRunResult> {
    const { project, manifest, outputDir, generatedAt, year, log } = ctx;

    const config: WordPressSiteConfig = {
      siteName: manifest.name ?? project.name,
      siteUrl: `https://${project.slug}.telemax.local`,
    };
    const validation = validateProject(config);
    if (isErr(validation)) throw new Error(validation.error.message);
    const resolved = resolveWordPressConfig(config);

    log("knowledge", `Seeding knowledge base (${manifest.knowledgePack || "@telemax/knowledge"})`);
    const knowledge = await seedKnowledge();

    log("workflow", "Initialising workflow engine");
    const workflow = new WorkflowEngine();

    const prompt = await buildPromptEngine();
    const { orchestrator, providerId } = buildOrchestrator();
    log("ai", `AI provider: ${providerId}`);

    log("generator", "Registering generator and producing artifacts");
    const generator = new GeneratorEngine({ ai: resilientAiRunner(orchestrator) });
    const registered = await registerWordPressNews(
      { generator, workflow, prompt, knowledge },
      resolved,
    );
    if (isErr(registered)) throw new Error(registered.error.message);

    const produced = await generator.generate(
      WORDPRESS_NEWS_GENERATOR,
      assembleVariables(resolved, year, generatedAt),
    );
    if (isErr(produced)) throw new Error(produced.error.message);

    const artifacts = produced.value.artifacts.list();
    log("writing", `Writing ${String(artifacts.length)} artifacts to output/`);
    const written = writeProject(artifacts, outputDir, { generatedAt });
    if (isErr(written)) throw new Error(written.error.message);

    return {
      fileCount: written.value.fileCount,
      contentPlan: readContentPlan(produced.value.variables),
    };
  },
};
