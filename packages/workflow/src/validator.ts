/**
 * {@link WorkflowValidator} — structural validation of a {@link WorkflowDefinition}
 * (unique step ids, well-formed steps and conditions). Returns the definition on
 * success or a {@link WorkflowValidationError} aggregating every issue.
 */
import { err, ok, type Result } from "@telemax/core";
import type { Condition } from "./domain/condition.js";
import type { WorkflowDefinition } from "./domain/definition.js";
import type { WorkflowStep } from "./domain/step.js";
import { WorkflowValidationError, type WorkflowError } from "./errors.js";

export class WorkflowValidator {
  public validate(definition: WorkflowDefinition): Result<WorkflowDefinition, WorkflowError> {
    const issues: string[] = [];
    if (definition.id.trim().length === 0) {
      issues.push("Workflow id must not be empty.");
    }
    if (definition.name.trim().length === 0) {
      issues.push("Workflow name must not be empty.");
    }
    const seen = new Set<string>();
    walk(definition.root, seen, issues);
    if (issues.length > 0) {
      return err(new WorkflowValidationError("Workflow validation failed.", issues));
    }
    return ok(definition);
  }
}

function walk(step: WorkflowStep, seen: Set<string>, issues: string[]): void {
  if (step.id.trim().length === 0) {
    issues.push("Every step must have a non-empty id.");
  } else if (seen.has(step.id)) {
    issues.push(`Duplicate step id: "${step.id}".`);
  } else {
    seen.add(step.id);
  }

  switch (step.kind) {
    case "task":
      if (step.handler.trim().length === 0) {
        issues.push(`Task "${step.id}" must reference a handler.`);
      }
      break;
    case "sequence":
      step.steps.forEach((child) => walk(child, seen, issues));
      break;
    case "parallel":
      if (step.branches.length === 0) {
        issues.push(`Parallel "${step.id}" must have at least one branch.`);
      }
      step.branches.forEach((child) => walk(child, seen, issues));
      break;
    case "branch":
      validateCondition(step.condition, step.id, issues);
      step.then.forEach((child) => walk(child, seen, issues));
      (step.otherwise ?? []).forEach((child) => walk(child, seen, issues));
      break;
    case "loop":
      if (step.maxIterations <= 0) {
        issues.push(`Loop "${step.id}" must have maxIterations > 0.`);
      }
      if (step.condition !== undefined) {
        validateCondition(step.condition, step.id, issues);
      }
      step.body.forEach((child) => walk(child, seen, issues));
      break;
    case "subworkflow":
      if (step.workflowId.trim().length === 0) {
        issues.push(`Subworkflow "${step.id}" must reference a workflowId.`);
      }
      break;
    case "approval":
      if (step.prompt.trim().length === 0) {
        issues.push(`Approval "${step.id}" must have a prompt.`);
      }
      break;
    case "tool":
      if (step.tool.trim().length === 0) {
        issues.push(`Tool "${step.id}" must reference a tool.`);
      }
      break;
    default:
      issues.push("Unknown step kind.");
  }
}

function validateCondition(condition: Condition, stepId: string, issues: string[]): void {
  switch (condition.kind) {
    case "always":
      break;
    case "var-truthy":
    case "var-equals":
      if (condition.variable.trim().length === 0) {
        issues.push(`Condition in "${stepId}" must reference a variable.`);
      }
      break;
    case "not":
      validateCondition(condition.condition, stepId, issues);
      break;
    case "all":
    case "any":
      if (condition.conditions.length === 0) {
        issues.push(`Condition in "${stepId}" must have sub-conditions.`);
      }
      condition.conditions.forEach((entry) => validateCondition(entry, stepId, issues));
      break;
    default:
      issues.push(`Unknown condition in "${stepId}".`);
  }
}
