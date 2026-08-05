/**
 * WordPress-specific validation: the site configuration and template integrity
 * (non-empty bodies, unique ids, and only known `{{variables}}`).
 */
import { err, ok, type Result } from "@telemax/core";
import type { GeneratorTemplate } from "@telemax/generator-engine";
import { WordPressConfigError, type WordPressError } from "./errors.js";
import type { WordPressSiteConfig } from "./types.js";

/** Validate the caller-supplied WordPress site configuration. */
export function validateWordPressConfig(
  config: WordPressSiteConfig,
): Result<WordPressSiteConfig, WordPressError> {
  const issues: string[] = [];
  if (config.siteName.trim().length === 0) {
    issues.push("siteName must not be empty.");
  }
  if (config.siteUrl !== undefined && !/^https?:\/\//.test(config.siteUrl)) {
    issues.push("siteUrl must be an absolute http(s) URL.");
  }
  if (config.primaryColor !== undefined && !/^#[0-9a-fA-F]{3,8}$/.test(config.primaryColor)) {
    issues.push("primaryColor must be a hex color.");
  }
  (config.adSlots ?? []).forEach((slot, index) => {
    if (slot.id.trim().length === 0) {
      issues.push(`adSlots[${String(index)}].id must not be empty.`);
    }
  });
  if (issues.length > 0) {
    return err(new WordPressConfigError("WordPress site configuration is invalid.", issues));
  }
  return ok(config);
}

/** Validate template integrity against the set of known variable names. */
export function validateTemplates(
  templates: readonly GeneratorTemplate[],
  knownVariables: readonly string[],
): Result<readonly GeneratorTemplate[], WordPressError> {
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
    return err(new WordPressConfigError("Template validation failed.", issues));
  }
  return ok(templates);
}
