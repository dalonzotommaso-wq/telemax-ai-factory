/**
 * Workflow Engine integration. A prepare workflow computes the build metadata
 * that is written to `.telemax/build-info.json`.
 */
import type { WorkflowDefinition } from "@telemax/workflow";
import type { ResolvedWordPressConfig } from "./types.js";
import { GENERATOR_VERSION } from "./variables.js";

/** Workflow id of the WordPress prepare workflow. */
export const WP_PREPARE_WORKFLOW = "wp-prepare";

/** Build the prepare workflow for a given resolved config. */
export function buildPrepareWorkflow(config: ResolvedWordPressConfig): WorkflowDefinition {
  return {
    id: WP_PREPARE_WORKFLOW,
    name: "WordPress prepare",
    root: {
      id: "build-meta",
      kind: "task",
      handler: "echo",
      input: {
        generator: "wordpress-news",
        generatorVersion: GENERATOR_VERSION,
        site: config.siteName,
        target: "wordpress",
      },
      output: "build",
    },
  };
}
