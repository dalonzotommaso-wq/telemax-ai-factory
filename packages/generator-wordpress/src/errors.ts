/** WordPress generator error types. */
import { FrameworkError, type FrameworkErrorOptions } from "@telemax/core";

/** The WordPress site configuration or a template failed validation. */
export class WordPressConfigError extends FrameworkError {
  public readonly code = "ERR_WORDPRESS_CONFIG";
  public readonly issues: readonly string[];

  public constructor(message: string, issues: readonly string[], options?: FrameworkErrorOptions) {
    super(message, options);
    this.issues = issues;
  }
}

/** Union of WordPress generator errors. */
export type WordPressError = WordPressConfigError;
