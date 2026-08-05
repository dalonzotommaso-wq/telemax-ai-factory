/**
 * Public API of `@telemax/generator-wordpress` — the first real generator of
 * Telemax AI Factory. Produces the complete WordPress News theme project as
 * versioned, validated artifacts via the Generator Engine, integrating the
 * Workflow, Prompt and Knowledge engines. Project scaffolding only — no plugin,
 * no definitive WordPress code.
 */

// Types & config
export { WORDPRESS_TARGET } from "./types.js";
export type { WordPressSiteConfig, ResolvedWordPressConfig, AdSlot, MenuItem } from "./types.js";
export { resolveWordPressConfig } from "./config.js";
export { WordPressConfigError } from "./errors.js";
export type { WordPressError } from "./errors.js";

// Validation
export { validateWordPressConfig, validateTemplates } from "./validator.js";
export { validateProject } from "./validation-engine.js";
export type { ProjectValidationReport } from "./validation-engine.js";

// Variables & templates
export { GENERATOR_VERSION, KNOWN_VARIABLES, buildVariables } from "./variables.js";
export { assembleVariables } from "./assemble.js";
export { allTemplates } from "./templates/index.js";

// Blueprints
export {
  defaultDesignTokens,
  tokensToCss,
  componentRegistry,
  componentScaffolds,
  layoutBlueprint,
  seoBlueprint,
  accessibilityBlueprint,
  contrastRatio,
  webVitalsBlueprint,
  advertisementBlueprint,
  performanceBlueprint,
  buildProjectBlueprint,
  blueprintDoc,
} from "./blueprint/index.js";
export type {
  DesignTokens,
  ComponentSpec,
  ComponentCategory,
  LayoutBlueprint,
  PageLayout,
  RegionPlan,
  Region,
  SeoBlueprint,
  SeoDeclaration,
  AccessibilityBlueprint,
  ContrastCheck,
  WebVitalsBlueprint,
  AdvertisementBlueprint,
  AdPosition,
  PerformanceBlueprint,
  ProjectBlueprint,
  ArtifactNode,
} from "./blueprint/index.js";

// Integrations
export { seedKnowledge, conventionsTransform, NAMING_CONVENTIONS_DOC } from "./knowledge.js";
export { buildPrepareWorkflow, WP_PREPARE_WORKFLOW } from "./workflow.js";
export { buildPromptEngine, WP_META_TEMPLATE, WP_META_BODY } from "./prompts.js";
export type { PromptEngineInstance } from "./prompts.js";

// Generator, pipeline, wiring, runner
export { WORDPRESS_NEWS_GENERATOR, buildWordPressNewsDefinition } from "./generator.js";
export { buildPipeline } from "./pipeline.js";
export { registerWordPressNews } from "./di.js";
export type { WordPressNewsDeps } from "./di.js";
export { generateWordPressNews } from "./runner.js";
export type { GenerateOptions } from "./runner.js";
export { generateWordPressNewsProject, DEFAULT_OUTPUT_DIR } from "./project.js";
export type { GenerateProjectOptions } from "./project.js";
export { writeProject } from "./write.js";
export type { WrittenProject, ArtifactManifestEntry } from "./write.js";
