/**
 * {@link GeneratorValidator} — structural validation of a
 * {@link GeneratorDefinition} (unique ids, well-formed steps and templates).
 */
import { err, ok, type Result } from "@telemax/core";
import type { GeneratorDefinition } from "./domain/definition.js";
import type { GeneratorStep } from "./domain/step.js";
import { GeneratorValidationError, type GeneratorError } from "./errors.js";

export class GeneratorValidator {
  public validate(definition: GeneratorDefinition): Result<GeneratorDefinition, GeneratorError> {
    const issues: string[] = [];
    if (definition.id.trim().length === 0) {
      issues.push("Generator id must not be empty.");
    }
    if (definition.name.trim().length === 0) {
      issues.push("Generator name must not be empty.");
    }
    if (definition.pipeline.steps.length === 0) {
      issues.push("Generator pipeline must have at least one step.");
    }

    const stepIds = new Set<string>();
    for (const step of definition.pipeline.steps) {
      if (step.id.trim().length === 0) {
        issues.push("Every step must have a non-empty id.");
      } else if (stepIds.has(step.id)) {
        issues.push(`Duplicate step id: "${step.id}".`);
      } else {
        stepIds.add(step.id);
      }
      validateStep(step, issues);
    }

    const templateIds = new Set<string>();
    for (const template of definition.templates ?? []) {
      if (templateIds.has(template.id)) {
        issues.push(`Duplicate template id: "${template.id}".`);
      } else {
        templateIds.add(template.id);
      }
    }

    if (issues.length > 0) {
      return err(new GeneratorValidationError("Generator validation failed.", issues));
    }
    return ok(definition);
  }
}

function validateStep(step: GeneratorStep, issues: string[]): void {
  switch (step.kind) {
    case "template":
      if (step.templateId.trim().length === 0 || step.path.trim().length === 0) {
        issues.push(`Template step "${step.id}" needs a templateId and a path.`);
      }
      break;
    case "emit":
      if (step.path.trim().length === 0) {
        issues.push(`Emit step "${step.id}" needs a path.`);
      }
      if (step.content === undefined && step.fromVariable === undefined) {
        issues.push(`Emit step "${step.id}" needs content or fromVariable.`);
      }
      break;
    case "transform":
      if (step.transform.trim().length === 0 || step.output.trim().length === 0) {
        issues.push(`Transform step "${step.id}" needs a transform and an output.`);
      }
      break;
    case "workflow":
      if (step.workflowId.trim().length === 0 || step.output.trim().length === 0) {
        issues.push(`Workflow step "${step.id}" needs a workflowId and an output.`);
      }
      break;
    case "prompt":
      if (step.templateId.trim().length === 0 || step.output.trim().length === 0) {
        issues.push(`Prompt step "${step.id}" needs a templateId and an output.`);
      }
      break;
    case "ai":
      if (step.output.trim().length === 0) {
        issues.push(`AI step "${step.id}" needs an output.`);
      }
      break;
    default:
      issues.push("Unknown step kind.");
  }
}
