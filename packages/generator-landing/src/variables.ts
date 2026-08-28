/** Compute the flat variable record consumed by the generator templates. */
import type { StructuredValue } from "@telemax/knowledge";
import type { ResolvedLandingPageConfig } from "./types.js";
import { escapeHtml } from "./html.js";

/** Version stamped into generated artifacts. */
export const GENERATOR_VERSION = "0.1.0";

/**
 * Names of every variable referenced by the templates (used for validation).
 * Includes both the config-derived variables and the ones produced by the
 * integration/transform steps of the pipeline.
 */
export const KNOWN_VARIABLES: readonly string[] = [
  // config-derived
  "siteName",
  "tagline",
  "description",
  "language",
  "siteSlug",
  "siteUrl",
  "primaryColor",
  "secondaryColor",
  "sectionsList",
  "year",
  "generatorVersion",
  "generatedAt",
  // integration / transform outputs
  "buildManifest",
  "namingConventions",
  "seoTitle",
  "metaDescription",
  "keywordsList",
  "heroHeadline",
  "heroSubheadline",
  "ctaLabel",
  "ctaHref",
  "navHtml",
  "sectionsHtml",
  "featuresHtml",
  "footerTagline",
  "contentPlanJson",
  "tokensCss",
  "designTokensJson",
];

/** Build the base (config-derived) variables. Integration steps add the rest. */
export function buildVariables(
  config: ResolvedLandingPageConfig,
  year: number,
  generatedAt: string,
): Record<string, StructuredValue> {
  // siteName / tagline flow straight into HTML and Markdown templates, so they
  // are HTML-escaped here. Content Plan fields are escaped by their own transforms.
  return {
    siteName: escapeHtml(config.siteName),
    tagline: escapeHtml(config.tagline),
    description: escapeHtml(config.description),
    language: config.language,
    siteSlug: config.siteSlug,
    siteUrl: config.siteUrl,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    sectionsList: config.sections.join(", "),
    year,
    generatorVersion: GENERATOR_VERSION,
    generatedAt,
  };
}
