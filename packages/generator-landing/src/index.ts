/**
 * Public API of `@telemax/generator-landing` — the second real generator of
 * Telemax AI Factory. Produces a complete single-page static HTML/CSS landing
 * page ("vetrina") as versioned, validated artifacts via the Generator Engine,
 * with AI-written copy through the same Content Plan mechanism as
 * `@telemax/generator-wordpress`. Static project output only.
 */

// Types & config
export { LANDING_TARGET } from "./types.js";
export type { LandingPageConfig, ResolvedLandingPageConfig, SectionSeed } from "./types.js";
export { resolveLandingPageConfig, DEFAULT_SECTIONS } from "./config.js";
export { LandingPageConfigError } from "./errors.js";
export type { LandingPageError } from "./errors.js";

// Validation
export { validateLandingPageConfig, validateTemplates } from "./validator.js";
export { validateProject } from "./validation-engine.js";
export type { ProjectValidationReport } from "./validation-engine.js";

// Variables, tokens & templates
export { GENERATOR_VERSION, KNOWN_VARIABLES, buildVariables } from "./variables.js";
export { assembleVariables } from "./assemble.js";
export { defaultDesignTokens, tokensToCss } from "./tokens.js";
export type { DesignTokens } from "./tokens.js";
export { allTemplates } from "./templates/index.js";

// Integrations
export {
  seedKnowledge,
  conventionsTransform,
  getConventions,
  LANDING_CONVENTIONS_DOC,
} from "./knowledge.js";
export { buildPrepareWorkflow, LP_PREPARE_WORKFLOW } from "./workflow.js";
export {
  buildPromptEngine,
  renderContentPlanInstruction,
  LP_META_TEMPLATE,
  LP_META_BODY,
  LP_CONTENT_PLAN_TEMPLATE,
  LP_CONTENT_PLAN_BODY,
} from "./prompts.js";
export type { PromptEngineInstance } from "./prompts.js";
export { resilientAiRunner, isFallback, STUB_MARKER } from "./ai.js";
export {
  parseContentPlan,
  validateContentPlan,
  deterministicContentPlan,
  buildContentPlan,
  sanitizeText,
  escapeHtml,
  sanitizeHref,
  renderNavHtml,
  renderSectionsHtml,
  renderFeaturesHtml,
  contentPlanTransform,
  CONTENT_PLAN_FIELD_TRANSFORMS,
} from "./content-plan.js";
export type {
  LandingContentPlan,
  LandingContentPlanSeo,
  LandingContentPlanHero,
  LandingContentPlanCta,
  LandingContentPlanSection,
  LandingContentPlanFeature,
  ContentPlanEnvelope,
  ContentPlanSource,
  ContentPlanValidation,
} from "./content-plan.js";

// Generator, pipeline, wiring, runner
export { LANDING_PAGE_GENERATOR, buildLandingPageDefinition } from "./generator.js";
export { buildPipeline } from "./pipeline.js";
export { registerLandingPage } from "./di.js";
export type { LandingPageDeps } from "./di.js";
export { generateLandingPage } from "./runner.js";
export type { GenerateOptions } from "./runner.js";
export { generateLandingPageProject, DEFAULT_OUTPUT_DIR } from "./project.js";
export type { GenerateProjectOptions } from "./project.js";
export { writeProject } from "./write.js";
export type { WrittenProject, ArtifactManifestEntry } from "./write.js";
