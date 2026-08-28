/** Landing Page generator error types. */
import { FrameworkError, type FrameworkErrorOptions } from "@telemax/core";

/** The landing page configuration or a template failed validation. */
export class LandingPageConfigError extends FrameworkError {
  public readonly code = "ERR_LANDING_CONFIG";
  public readonly issues: readonly string[];

  public constructor(message: string, issues: readonly string[], options?: FrameworkErrorOptions) {
    super(message, options);
    this.issues = issues;
  }
}

/** Union of Landing Page generator errors. */
export type LandingPageError = LandingPageConfigError;
