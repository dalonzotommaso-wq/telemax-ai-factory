/**
 * {@link KnowledgeValidator} — validates documents against a composable set of
 * {@link ValidationRule}s (Open/Closed: add rules without changing the engine).
 * Returns the document on success, or a {@link KnowledgeValidationError}
 * aggregating every issue found.
 */
import { err, ok, type Result } from "@telemax/core";
import { KnowledgeValidationError, type KnowledgeError } from "./errors.js";
import { BINARY_FORMATS, TEXT_FORMATS } from "./types.js";
import type { Document } from "./domain/document.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A single validation rule producing zero or more issue messages. */
export interface ValidationRule {
  readonly name: string;
  validate(document: Document): readonly string[];
}

/** Options controlling the default rule set. */
export interface ValidatorOptions {
  readonly maxContentBytes?: number;
  readonly rules?: readonly ValidationRule[];
}

/** Build the default rules given a maximum content size. */
export function defaultRules(maxContentBytes: number): readonly ValidationRule[] {
  return [
    {
      name: "id-present",
      validate: (document): readonly string[] =>
        document.id.length > 0 ? [] : ["Document id must not be empty."],
    },
    {
      name: "known-format",
      validate: (document): readonly string[] =>
        TEXT_FORMATS.includes(document.format) || BINARY_FORMATS.includes(document.format)
          ? []
          : [`Unknown content format: ${document.format}.`],
    },
    {
      name: "content-size",
      validate: (document): readonly string[] => {
        const bytes = Buffer.byteLength(document.content, "utf8");
        return bytes <= maxContentBytes
          ? []
          : [`Content exceeds maximum size (${String(bytes)} > ${String(maxContentBytes)} bytes).`];
      },
    },
    {
      name: "label-slugs",
      validate: (document): readonly string[] => {
        const issues: string[] = [];
        for (const category of document.metadata.categories) {
          if (!SLUG_PATTERN.test(category)) {
            issues.push(`Invalid category slug: "${category}".`);
          }
        }
        for (const tag of document.metadata.tags) {
          if (!SLUG_PATTERN.test(tag)) {
            issues.push(`Invalid tag slug: "${tag}".`);
          }
        }
        return issues;
      },
    },
  ];
}

export class KnowledgeValidator {
  private readonly rules: readonly ValidationRule[];

  public constructor(options?: ValidatorOptions) {
    const maxContentBytes = options?.maxContentBytes ?? 5 * 1024 * 1024;
    this.rules = options?.rules ?? defaultRules(maxContentBytes);
  }

  /** Validate a document, aggregating all rule issues. */
  public validate(document: Document): Result<Document, KnowledgeError> {
    const issues = this.rules.flatMap((rule) => rule.validate(document));
    if (issues.length > 0) {
      return err(new KnowledgeValidationError("Document validation failed.", issues));
    }
    return ok(document);
  }
}
