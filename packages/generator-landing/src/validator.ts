/**
 * Landing-page-specific validation: the caller configuration and template
 * integrity (non-empty bodies, unique ids, and only known `{{variables}}`).
 *
 * NOTE: `validateTemplates` mirrors the equivalent helper in
 * `@telemax/generator-wordpress`. It is kept local per generator for now; a
 * shared helper in `@telemax/generator-engine` is a possible later consolidation.
 */
import { err, ok, type Result } from "@telemax/core";
import type { GeneratorTemplate } from "@telemax/generator-engine";
import { LandingPageConfigError, type LandingPageError } from "./errors.js";
import type { LandingPageConfig } from "./types.js";

/** Validate the caller-supplied landing page configuration. */
export function validateLandingPageConfig(
  config: LandingPageConfig,
): Result<LandingPageConfig, LandingPageError> {
  const issues: string[] = [];
  if (config.siteName.trim().length === 0) {
    issues.push("siteName must not be empty.");
  }
  if (config.siteUrl !== undefined && !/^https?:\/\//.test(config.siteUrl)) {
    issues.push("siteUrl must be an absolute http(s) URL.");
  }
  for (const key of ["primaryColor", "secondaryColor"] as const) {
    const value = config[key];
    if (value !== undefined && !/^#[0-9a-fA-F]{3,8}$/.test(value)) {
      issues.push(`${key} must be a hex color.`);
    }
  }
  (config.sections ?? []).forEach((section, index) => {
    if (section.trim().length === 0) {
      issues.push(`sections[${String(index)}] must not be empty.`);
    }
  });
  if (issues.length > 0) {
    return err(new LandingPageConfigError("Landing page configuration is invalid.", issues));
  }
  return ok(config);
}

/** Validate template integrity against the set of known variable names. */
export function validateTemplates(
  templates: readonly GeneratorTemplate[],
  knownVariables: readonly string[],
): Result<readonly GeneratorTemplate[], LandingPageError> {
  const issues: string[] = [];
  const known = new Set(knownVariables);
  const seen = new Set<string>();
  for (const template of templates) {
    if (template.body.trim().length === 0) {
      issues.push(`Template "${template.id}" has an empty body.`);
    }
    if (seen.has(template.id)) {
      issues.push(`Duplicate template id "${template.id}".`);
    } else {
      seen.add(template.id);
    }
    for (const match of template.body.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) {
      const name = match[1];
      if (name !== undefined && !known.has(name)) {
        issues.push(`Template "${template.id}" references unknown variable "${name}".`);
      }
    }
  }
  if (issues.length > 0) {
    return err(new LandingPageConfigError("Template validation failed.", issues));
  }
  return ok(templates);
}
