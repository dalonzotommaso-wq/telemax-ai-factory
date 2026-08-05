/**
 * {@link DefaultSchemaValidator} — validates variable values against a
 * {@link VariableSchema}, filling declared defaults. Extra (undeclared)
 * variables are allowed. JSON-Schema validation is a separate, prepared port.
 */
import { err, ok, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import { PromptValidationError, type PromptError } from "../errors.js";
import type { VariableDefinition, VariableSchema, VariableValues } from "../domain/variable.js";
import type { SchemaValidator } from "../interfaces.js";

export class DefaultSchemaValidator implements SchemaValidator {
  public validate(
    schema: VariableSchema,
    values: VariableValues,
  ): Result<VariableValues, PromptError> {
    const issues: string[] = [];
    const resolved: Record<string, StructuredValue> = { ...values };

    for (const definition of schema) {
      const provided = values[definition.name];
      const value = provided ?? definition.default;
      if (value === undefined) {
        if (definition.required) {
          issues.push(`Missing required variable "${definition.name}".`);
        }
        continue;
      }
      const typeIssue = checkType(definition, value);
      if (typeIssue !== undefined) {
        issues.push(typeIssue);
        continue;
      }
      resolved[definition.name] = value;
    }

    if (issues.length > 0) {
      return err(new PromptValidationError("Variable validation failed.", issues));
    }
    return ok(resolved);
  }
}

function checkType(definition: VariableDefinition, value: StructuredValue): string | undefined {
  switch (definition.type) {
    case "string":
      return typeof value === "string" ? undefined : typeMismatch(definition, "string");
    case "number":
      return typeof value === "number" ? undefined : typeMismatch(definition, "number");
    case "boolean":
      return typeof value === "boolean" ? undefined : typeMismatch(definition, "boolean");
    case "list":
      return Array.isArray(value) ? undefined : typeMismatch(definition, "list");
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value)
        ? undefined
        : typeMismatch(definition, "object");
    case "enum":
      if (typeof value !== "string") {
        return typeMismatch(definition, "enum (string)");
      }
      return (definition.enumValues ?? []).includes(value)
        ? undefined
        : `Variable "${definition.name}" must be one of: ${(definition.enumValues ?? []).join(", ")}.`;
    default:
      return `Unknown variable type for "${definition.name}".`;
  }
}

function typeMismatch(definition: VariableDefinition, expected: string): string {
  return `Variable "${definition.name}" must be of type ${expected}.`;
}
