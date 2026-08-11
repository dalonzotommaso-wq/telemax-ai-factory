/** Build the generator pipeline: integration steps, template steps, emit steps. */
import type { GeneratorStep } from "@telemax/generator-engine";
import type { ResolvedWordPressConfig } from "./types.js";
import { allTemplates } from "./templates/index.js";
import { componentScaffolds } from "./blueprint/index.js";
import { WP_PREPARE_WORKFLOW } from "./workflow.js";
import { WP_META_TEMPLATE } from "./prompts.js";
import { AI_CONTENT_PLAN_VAR, CONTENT_PLAN_ENVELOPE_VAR, META_BASE_VAR } from "./content-plan.js";

const CONVENTIONS_TRANSFORM = "wp-conventions";
const CONTENT_PLAN_TRANSFORM = "wp-content-plan";

function robotsTxt(): string {
  return `# {{siteName}} — robots
User-agent: *
Allow: /
Disallow: /wp-admin/

Sitemap: {{siteUrl}}/wp-sitemap.xml
`;
}

const BLUEPRINT_EMITS: readonly { readonly path: string; readonly variable: string }[] = [
  { path: "assets/css/tokens.css", variable: "tokensCss" },
  { path: "config/design-tokens.json", variable: "designTokensJson" },
  { path: "config/layout.blueprint.json", variable: "layoutBlueprintJson" },
  { path: "config/components.json", variable: "componentsJson" },
  { path: "config/seo.blueprint.json", variable: "seoBlueprintJson" },
  { path: "config/accessibility.blueprint.json", variable: "a11yBlueprintJson" },
  { path: "config/web-vitals.blueprint.json", variable: "webVitalsJson" },
  { path: "config/advertising.blueprint.json", variable: "advertisingJson" },
  { path: "config/performance.blueprint.json", variable: "performanceJson" },
  { path: "config/project.blueprint.json", variable: "projectBlueprintJson" },
  { path: "docs/BLUEPRINT.md", variable: "blueprintDoc" },
];

const IMAGE_DIRS: readonly string[] = ["", "logos", "icons", "placeholders"];

/** Build the ordered pipeline for a resolved config. */
export function buildPipeline(
  config: ResolvedWordPressConfig,
  aiContentPlanPrompt = "",
): readonly GeneratorStep[] {
  const steps: GeneratorStep[] = [];

  // Integration steps (produce variables) — coordinate Workflow, Prompt, Knowledge.
  steps.push({
    id: "step-build",
    kind: "workflow",
    workflowId: WP_PREPARE_WORKFLOW,
    input: {},
    output: "buildManifest",
  });

  // Deterministic Prompt-Engine SEO base — feeds the fallback Content Plan.
  steps.push({
    id: "step-meta-base",
    kind: "prompt",
    templateId: WP_META_TEMPLATE,
    variables: { siteName: config.siteName, siteDescription: config.siteDescription },
    output: META_BASE_VAR,
  });

  // AI Content Plan -> validated envelope -> flattened template variables.
  steps.push({
    id: "step-ai-content-plan",
    kind: "ai",
    input: aiContentPlanPrompt,
    output: AI_CONTENT_PLAN_VAR,
  });
  steps.push({
    id: "step-content-plan",
    kind: "transform",
    transform: CONTENT_PLAN_TRANSFORM,
    output: CONTENT_PLAN_ENVELOPE_VAR,
  });
  const flatten: readonly {
    readonly id: string;
    readonly transform: string;
    readonly output: string;
  }[] = [
    { id: "step-cp-title", transform: "wp-cp-title", output: "siteTitle" },
    { id: "step-cp-tagline", transform: "wp-cp-tagline", output: "tagline" },
    { id: "step-cp-description", transform: "wp-cp-description", output: "siteDescription" },
    { id: "step-cp-meta", transform: "wp-cp-meta", output: "metaDescription" },
    { id: "step-cp-seotitle", transform: "wp-cp-seotitle", output: "seoTitle" },
    { id: "step-cp-categories", transform: "wp-cp-categories", output: "categoriesList" },
    { id: "step-cp-json", transform: "wp-cp-json", output: "contentPlanJson" },
  ];
  for (const f of flatten) {
    steps.push({ id: f.id, kind: "transform", transform: f.transform, output: f.output });
  }

  steps.push({
    id: "step-conventions",
    kind: "transform",
    transform: CONVENTIONS_TRANSFORM,
    output: "namingConventions",
  });

  // Template artifacts (theme, layouts, partials, ads, seo, docs + components).
  for (const template of [...allTemplates(), ...componentScaffolds()]) {
    steps.push({
      id: `tpl-${template.id}`,
      kind: "template",
      templateId: template.id,
      path: `{{themeSlug}}/${template.name}`,
    });
  }

  // Emitted artifacts.
  steps.push({
    id: "emit-robots",
    kind: "emit",
    path: "{{themeSlug}}/robots.txt",
    content: robotsTxt(),
  });
  steps.push({
    id: "emit-build",
    kind: "emit",
    path: "{{themeSlug}}/.telemax/build-info.json",
    fromVariable: "buildManifest",
  });
  steps.push({
    id: "emit-conventions",
    kind: "emit",
    path: "{{themeSlug}}/docs/NAMING-CONVENTIONS.md",
    fromVariable: "namingConventions",
  });
  steps.push({
    id: "emit-content-plan",
    kind: "emit",
    path: "{{themeSlug}}/config/content-plan.json",
    fromVariable: "contentPlanJson",
  });
  for (const emit of BLUEPRINT_EMITS) {
    steps.push({
      id: `emit-${emit.variable}`,
      kind: "emit",
      path: `{{themeSlug}}/${emit.path}`,
      fromVariable: emit.variable,
    });
  }
  for (const dir of IMAGE_DIRS) {
    const suffix = dir === "" ? "assets/images" : `assets/images/${dir}`;
    steps.push({
      id: `gitkeep-${dir === "" ? "root" : dir}`,
      kind: "emit",
      path: `{{themeSlug}}/${suffix}/.gitkeep`,
      content: "",
    });
  }

  return steps;
}
