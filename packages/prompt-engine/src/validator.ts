/**
 * {@link PromptValidator} — validates templates against composable rules
 * (Open/Closed). Returns the template on success, or a
 * {@link PromptValidationError} aggregating every issue.
 */
import { err, ok, type Result } from "@telemax/core";
import { PromptValidationError, type PromptError } from "./errors.js";
import { PREPARED_FORMATS, SUPPORTED_FORMATS } from "./types.js";
import type { PromptTemplate } from "./domain/template.js";

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** A single template validation rule. */
export interface PromptValidationRule {
  readonly name: string;
  validate(template: PromptTemplate): readonly string[];
}

/** The default template validation rules. */
export function defaultTemplateRules(): readonly PromptValidationRule[] {
  return [
    {
      name: "identity",
      validate: (template): readonly string[] => {
        const issues: string[] = [];
        if (template.id.length === 0) {
          issues.push("Template id must not be empty.");
        }
        if (template.name.trim().length === 0) {
          issues.push("Template name must not be empty.");
        }
        return issues;
      },
    },
    {
      name: "known-format",
      validate: (template): readonly string[] =>
        SUPPORTED_FORMATS.includes(template.format) || PREPARED_FORMATS.includes(template.format)
          ? []
          : [`Unknown prompt format: ${template.format}.`],
    },
    {
      name: "variables",
      validate: (template): readonly string[] => {
        const issues: string[] = [];
        const seen = new Set<string>();
        for (const variable of template.variables) {
          if (!IDENTIFIER.test(variable.name)) {
            issues.push(`Invalid variable name: "${variable.name}".`);
          }
          if (seen.has(variable.name)) {
            issues.push(`Duplicate variable: "${variable.name}".`);
          }
          seen.add(variable.name);
          if (variable.type === "enum" && (variable.enumValues ?? []).length === 0) {
            issues.push(`Enum variable "${variable.name}" must declare enumValues.`);
          }
        }
        return issues;
      },
    },
    {
      name: "relationships",
      validate: (template): readonly string[] => {
        const issues: string[] = [];
        if (template.extendsId === template.id) {
          issues.push("A template cannot extend itself.");
        }
        if (template.dependencies.includes(template.id)) {
          issues.push("A template cannot depend on itself.");
        }
        return issues;
      },
    },
  ];
}

export class PromptValidator {
  private readonly rules: readonly PromptValidationRule[];

  public constructor(rules?: readonly PromptValidationRule[]) {
    this.rules = rules ?? defaultTemplateRules();
  }

  public validate(template: PromptTemplate): Result<PromptTemplate, PromptError> {
    const issues = this.rules.flatMap((rule) => rule.validate(template));
    if (issues.length > 0) {
      return err(new PromptValidationError("Template validation failed.", issues));
    }
    return ok(template);
  }
}
