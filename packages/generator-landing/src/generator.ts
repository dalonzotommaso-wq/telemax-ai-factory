/** Build the declarative Landing Page generator definition. */
import type { GeneratorDefinition } from "@telemax/generator-engine";
import type { ResolvedLandingPageConfig } from "./types.js";
import { LANDING_TARGET } from "./types.js";
import { allTemplates } from "./templates/index.js";
import { buildPipeline } from "./pipeline.js";

/** Generator id of the Landing Page generator. */
export const LANDING_PAGE_GENERATOR = "landing-page";

/** Build the generator definition (templates + pipeline) for a resolved config. */
export function buildLandingPageDefinition(
  config: ResolvedLandingPageConfig,
  aiContentPlanPrompt = "",
): GeneratorDefinition {
  return {
    id: LANDING_PAGE_GENERATOR,
    name: "Landing Page",
    target: LANDING_TARGET,
    version: 1,
    templates: [...allTemplates()],
    pipeline: { steps: buildPipeline(config, aiContentPlanPrompt) },
    configuration: { target: LANDING_TARGET },
    metadata: {
      title: config.siteName,
      target: LANDING_TARGET,
      tags: ["landing-page", "static", "html"],
    },
  };
}
