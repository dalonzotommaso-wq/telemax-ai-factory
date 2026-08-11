/** Build the declarative WordPress News generator definition. */
import type { GeneratorDefinition } from "@telemax/generator-engine";
import type { ResolvedWordPressConfig } from "./types.js";
import { allTemplates } from "./templates/index.js";
import { componentScaffolds } from "./blueprint/index.js";
import { buildPipeline } from "./pipeline.js";

/** Generator id of the WordPress News generator. */
export const WORDPRESS_NEWS_GENERATOR = "wordpress-news";

/** Build the generator definition (templates + pipeline) for a resolved config. */
export function buildWordPressNewsDefinition(
  config: ResolvedWordPressConfig,
  aiContentPlanPrompt = "",
): GeneratorDefinition {
  return {
    id: WORDPRESS_NEWS_GENERATOR,
    name: "WordPress News",
    target: "wordpress",
    version: 1,
    templates: [...allTemplates(), ...componentScaffolds()],
    pipeline: { steps: buildPipeline(config, aiContentPlanPrompt) },
    configuration: { target: "wordpress" },
    metadata: { title: config.siteName, target: "wordpress", tags: ["wordpress", "news", "theme"] },
  };
}
