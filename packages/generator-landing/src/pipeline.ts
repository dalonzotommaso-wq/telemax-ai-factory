/** Build the generator pipeline: integration steps, template steps, emit steps. */
import type { GeneratorStep } from "@telemax/generator-engine";
import type { ResolvedLandingPageConfig } from "./types.js";
import { allTemplates } from "./templates/index.js";
import { LP_PREPARE_WORKFLOW } from "./workflow.js";
import { LP_META_TEMPLATE } from "./prompts.js";
import { AI_CONTENT_PLAN_VAR, CONTENT_PLAN_ENVELOPE_VAR, META_BASE_VAR } from "./content-plan.js";

const CONVENTIONS_TRANSFORM = "lp-conventions";
const CONTENT_PLAN_TRANSFORM = "lp-content-plan";

function robotsTxt(): string {
  return `# {{siteName}} — robots
User-agent: *
Allow: /

Sitemap: {{siteUrl}}/sitemap.xml
`;
}

/** Flat field transforms: Content Plan -> individual template variables. */
const FLATTEN: readonly {
  readonly id: string;
  readonly transform: string;
  readonly output: string;
}[] = [
  { id: "step-cp-seotitle", transform: "lp-cp-seotitle", output: "seoTitle" },
  { id: "step-cp-meta", transform: "lp-cp-meta", output: "metaDescription" },
  { id: "step-cp-keywords", transform: "lp-cp-keywords", output: "keywordsList" },
  { id: "step-cp-hero-headline", transform: "lp-cp-hero-headline", output: "heroHeadline" },
  {
    id: "step-cp-hero-subheadline",
    transform: "lp-cp-hero-subheadline",
    output: "heroSubheadline",
  },
  { id: "step-cp-cta-label", transform: "lp-cp-cta-label", output: "ctaLabel" },
  { id: "step-cp-cta-href", transform: "lp-cp-cta-href", output: "ctaHref" },
  { id: "step-cp-nav", transform: "lp-cp-nav-html", output: "navHtml" },
  { id: "step-cp-sections", transform: "lp-cp-sections-html", output: "sectionsHtml" },
  { id: "step-cp-features", transform: "lp-cp-features-html", output: "featuresHtml" },
  { id: "step-cp-footer", transform: "lp-cp-footer", output: "footerTagline" },
  { id: "step-cp-json", transform: "lp-cp-json", output: "contentPlanJson" },
];

const EMITS: readonly { readonly id: string; readonly path: string; readonly variable: string }[] =
  [
    { id: "emit-build", path: ".telemax/build-info.json", variable: "buildManifest" },
    { id: "emit-content-plan", path: "config/content-plan.json", variable: "contentPlanJson" },
    { id: "emit-design-tokens", path: "config/design-tokens.json", variable: "designTokensJson" },
    { id: "emit-tokens-css", path: "assets/css/tokens.css", variable: "tokensCss" },
    { id: "emit-conventions", path: "docs/NAMING-CONVENTIONS.md", variable: "namingConventions" },
  ];

/** Build the ordered pipeline for a resolved config. */
export function buildPipeline(
  config: ResolvedLandingPageConfig,
  aiContentPlanPrompt = "",
): readonly GeneratorStep[] {
  const steps: GeneratorStep[] = [];

  // Integration steps (produce variables) — coordinate Workflow, Prompt, AI, Knowledge.
  steps.push({
    id: "step-build",
    kind: "workflow",
    workflowId: LP_PREPARE_WORKFLOW,
    input: {},
    output: "buildManifest",
  });

  // Deterministic Prompt-Engine SEO base — feeds the fallback Content Plan.
  steps.push({
    id: "step-meta-base",
    kind: "prompt",
    templateId: LP_META_TEMPLATE,
    variables: { siteName: config.siteName, description: config.description },
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
  for (const f of FLATTEN) {
    steps.push({ id: f.id, kind: "transform", transform: f.transform, output: f.output });
  }

  steps.push({
    id: "step-conventions",
    kind: "transform",
    transform: CONVENTIONS_TRANSFORM,
    output: "namingConventions",
  });

  // Template artifacts (flat output: index.html, assets/…, README.md).
  for (const template of allTemplates()) {
    steps.push({
      id: `tpl-${template.id}`,
      kind: "template",
      templateId: template.id,
      path: template.name,
    });
  }

  // Emitted artifacts.
  steps.push({ id: "emit-robots", kind: "emit", path: "robots.txt", content: robotsTxt() });
  for (const emit of EMITS) {
    steps.push({ id: emit.id, kind: "emit", path: emit.path, fromVariable: emit.variable });
  }
  steps.push({ id: "gitkeep-images", kind: "emit", path: "assets/images/.gitkeep", content: "" });

  return steps;
}
