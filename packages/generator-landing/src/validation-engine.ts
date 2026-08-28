/**
 * Validation Engine: pre-generation validation of the project — the caller
 * configuration and template integrity (non-empty bodies, unique ids, only known
 * `{{variables}}`).
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import type { LandingPageError } from "./errors.js";
import { LandingPageConfigError } from "./errors.js";
import { allTemplates } from "./templates/index.js";
import { validateLandingPageConfig, validateTemplates } from "./validator.js";
import { KNOWN_VARIABLES } from "./variables.js";
import type { LandingPageConfig } from "./types.js";

/** Summary returned by a successful project validation. */
export interface ProjectValidationReport {
  readonly config: LandingPageConfig;
  readonly templateCount: number;
}

/** Run the complete pre-generation validation. */
export function validateProject(
  input: LandingPageConfig,
): Result<ProjectValidationReport, LandingPageError> {
  const configResult = validateLandingPageConfig(input);
  if (isErr(configResult)) {
    return configResult;
  }

  const templates = allTemplates();
  const templateResult = validateTemplates(templates, KNOWN_VARIABLES);
  if (isErr(templateResult)) {
    return templateResult;
  }

  if (templates.length === 0) {
    return err(new LandingPageConfigError("Project validation failed.", ["no templates defined"]));
  }

  return ok({ config: configResult.value, templateCount: templates.length });
}
