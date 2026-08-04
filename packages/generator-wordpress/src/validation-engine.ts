/**
 * Validation Engine: a complete pre-generation validation of the project —
 * configuration, template integrity, the artifact dependency graph (missing
 * dependencies and cycles) and WCAG AA contrast of the design tokens.
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import { resolveWordPressConfig } from "./config.js";
import { WordPressConfigError, type WordPressError } from "./errors.js";
import { allTemplates } from "./templates/index.js";
import { validateTemplates, validateWordPressConfig } from "./validator.js";
import { KNOWN_VARIABLES } from "./variables.js";
import { buildProjectBlueprint, componentScaffolds, type ArtifactNode } from "./blueprint/index.js";
import type { WordPressSiteConfig } from "./types.js";

/** Summary returned by a successful project validation. */
export interface ProjectValidationReport {
  readonly config: WordPressSiteConfig;
  readonly artifactCount: number;
  readonly componentCount: number;
  readonly contrastPasses: boolean;
}

function hasCycle(artifacts: readonly ArtifactNode[]): boolean {
  const adjacency = new Map<string, readonly string[]>();
  for (const node of artifacts) {
    adjacency.set(node.path, node.dependsOn);
  }
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (path: string): boolean => {
    if (done.has(path)) {
      return false;
    }
    if (visiting.has(path)) {
      return true;
    }
    visiting.add(path);
    for (const dep of adjacency.get(path) ?? []) {
      if (visit(dep)) {
        return true;
      }
    }
    visiting.delete(path);
    done.add(path);
    return false;
  };
  return artifacts.some((node) => visit(node.path));
}

/** Run the complete pre-generation validation. */
export function validateProject(
  input: WordPressSiteConfig,
): Result<ProjectValidationReport, WordPressError> {
  const configResult = validateWordPressConfig(input);
  if (isErr(configResult)) {
    return configResult;
  }

  const templates = [...allTemplates(), ...componentScaffolds()];
  const templateResult = validateTemplates(templates, KNOWN_VARIABLES);
  if (isErr(templateResult)) {
    return templateResult;
  }

  const resolved = resolveWordPressConfig(input);
  const blueprint = buildProjectBlueprint(resolved);
  const issues: string[] = [];
  const paths = new Set(blueprint.artifacts.map((node) => node.path));
  for (const node of blueprint.artifacts) {
    for (const dependency of node.dependsOn) {
      if (!paths.has(dependency)) {
        issues.push(`Artifact "${node.path}" depends on missing "${dependency}".`);
      }
    }
  }
  if (hasCycle(blueprint.artifacts)) {
    issues.push("Artifact dependency graph contains a cycle.");
  }
  if (!blueprint.accessibility.contrastPasses) {
    for (const entry of blueprint.accessibility.contrast) {
      if (!entry.passes) {
        issues.push(
          `Design token contrast "${entry.pair}" is ${entry.ratio.toFixed(2)}:1, below the ` +
            `required ${entry.requiredRatio.toFixed(1)}:1 (WCAG 2.2 AA).`,
        );
      }
    }
  }
  if (issues.length > 0) {
    return err(new WordPressConfigError("Project validation failed.", issues));
  }

  return ok({
    config: configResult.value,
    artifactCount: blueprint.artifacts.length,
    componentCount: blueprint.components.length,
    contrastPasses: blueprint.accessibility.contrastPasses,
  });
}
