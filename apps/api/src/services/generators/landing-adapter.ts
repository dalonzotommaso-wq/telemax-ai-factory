// -----------------------------------------------------------------------------
// LandingAdapter — wraps `@telemax/generator-landing`.
//
// Same shape as the WordPress adapter: it wires the engines, registers the
// landing-page generator, produces the artifacts and writes them to disk. The
// AI-written copy goes through the same Content Plan mechanism.
// -----------------------------------------------------------------------------
import { isErr } from "@telemax/core";
import { GeneratorEngine } from "@telemax/generator-engine";
import { WorkflowEngine } from "@telemax/workflow";
import {
  assembleVariables,
  buildPromptEngine,
  registerLandingPage,
  resilientAiRunner,
  resolveLandingPageConfig,
  seedKnowledge,
  validateProject,
  writeProject,
  LANDING_PAGE_GENERATOR,
  type LandingPageConfig,
} from "@telemax/generator-landing";
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

export const landingAdapter: GeneratorAdapter = {
  id: LANDING_PAGE_GENERATOR,

  matches(project: Project, manifest: ProjectManifest): boolean {
    return (
      generatorIdOf(project, manifest).includes("generator-landing") ||
      projectTypeOf(project, manifest) === "landing-page"
    );
  },

  async run(ctx: GeneratorRunContext): Promise<GeneratorRunResult> {
    const { project, manifest, outputDir, generatedAt, year, log } = ctx;

    const config: LandingPageConfig = {
      siteName: manifest.name ?? project.name,
      siteUrl: `https://${project.slug}.telemax.local`,
      ...(project.description.trim() !== "" ? { description: project.description } : {}),
    };
    const validation = validateProject(config);
    if (isErr(validation)) throw new Error(validation.error.message);
    const resolved = resolveLandingPageConfig(config);

    log("knowledge", `Seeding knowledge base (${manifest.knowledgePack || "@telemax/knowledge"})`);
    const knowledge = await seedKnowledge();

    log("workflow", "Initialising workflow engine");
    const workflow = new WorkflowEngine();

    const prompt = await buildPromptEngine();
    const { orchestrator, providerId } = buildOrchestrator();
    log("ai", `AI provider: ${providerId}`);

    log("generator", "Registering generator and producing artifacts");
    const generator = new GeneratorEngine({ ai: resilientAiRunner(orchestrator) });
    const registered = await registerLandingPage(
      { generator, workflow, prompt, knowledge },
      resolved,
    );
    if (isErr(registered)) throw new Error(registered.error.message);

    const produced = await generator.generate(
      LANDING_PAGE_GENERATOR,
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
